import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { VisitorLocation } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { latitude, longitude, city, state, country } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Capture IP and user-agent
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    const record = await VisitorLocation.create({
      latitude, longitude,
      city: city || '',
      state: state || '',
      country: country || 'India',
      ip, userAgent,
      capturedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: record._id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/location', err);
    return NextResponse.json({ error: 'Failed to store location' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000);

    const { VisitorLocation } = await import('@/lib/models');
    const records = await VisitorLocation.find({}).sort({ capturedAt: -1 }).limit(limit).lean();

    return NextResponse.json({ success: true, count: records.length, locations: records });
  } catch (err) {
    console.error('GET /api/location', err);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
