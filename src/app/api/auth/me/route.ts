import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: decoded.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('Session verification error:', err);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
}
