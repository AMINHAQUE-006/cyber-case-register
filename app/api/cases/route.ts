import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Case } from '@/lib/models';

function generateCaseId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CYB-${year}-${rand}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (state) query.state = state;
    if (search) {
      query.$or = [
        { caseId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [cases, total] = await Promise.all([
      Case.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Case.countDocuments(query),
    ]);

    return NextResponse.json({ cases, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /api/cases', err);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, state, aadhaarLast4, crimeType, incidentDate, description } = body;

    if (!name || !phone || !state || !aadhaarLast4 || !crimeType || !incidentDate || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Unique case ID (retry on collision)
    let caseId = generateCaseId();
    let exists = await Case.findOne({ caseId });
    while (exists) {
      caseId = generateCaseId();
      exists = await Case.findOne({ caseId });
    }

    const newCase = await Case.create({ ...body, caseId, status: 'Registered' });
    return NextResponse.json({ case: newCase, caseId: newCase.caseId }, { status: 201 });
  } catch (err) {
    console.error('POST /api/cases', err);
    return NextResponse.json({ error: 'Failed to register case' }, { status: 500 });
  }
}
