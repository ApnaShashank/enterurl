import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { createToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID Token is required' }, { status: 400 });
    }

    // Verify token with Google's API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Invalid Google token' }, { status: 400 });
    }

    const payload = await response.json();

    // Verify Audience to prevent spoofing
    const clientID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (payload.aud !== clientID) {
      return NextResponse.json({ success: false, error: 'Token audience mismatch' }, { status: 400 });
    }

    const email = payload.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email not provided in token' }, { status: 400 });
    }

    await connectToDatabase();
    let user = await User.findOne({ email });
    if (!user) {
      // Lazy sync: create new standard user in our local database
      const randomSalt = crypto.randomBytes(16).toString('hex');
      const randomHash = crypto.randomBytes(32).toString('hex');
      
      const adminEmail = (process.env.ADMIN_EMAIL || 'shashank8808108802@gmail.com').toLowerCase();
      const role = (email === adminEmail) ? 'admin' : 'standard';

      user = await User.create({
        email,
        passwordHash: `google_oauth_${randomHash}`,
        salt: randomSalt,
        role: role,
        createdAt: new Date()
      });
    }

    // Create session JWT token
    const token = createToken(user.email, user.role);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err: any) {
    console.error('Google Auth Route Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
