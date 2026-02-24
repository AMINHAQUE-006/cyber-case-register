import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, phone, password, state, location } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Account already exists with this email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email: email.toLowerCase(), phone, state,
      password: hashedPassword,
      location: location || null,
      registeredAt: new Date(),
    });

    return NextResponse.json({
      user: { name: user.name, email: user.email, phone: user.phone, state: user.state },
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/auth/register', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
