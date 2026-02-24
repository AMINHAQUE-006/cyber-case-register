import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Case } from '@/lib/models';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const found = await Case.findOne({ caseId: id.toUpperCase() }).lean();
    if (!found) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    return NextResponse.json({ case: found });
  } catch (err) {
    console.error('GET /api/cases/[id]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Admin auth check via secret header
    const adminSecret = req.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = ['status', 'assignedOfficer', 'officerNotes'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const updated = await Case.findOneAndUpdate(
      { caseId: id.toUpperCase() },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    return NextResponse.json({ case: updated });
  } catch (err) {
    console.error('PATCH /api/cases/[id]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
