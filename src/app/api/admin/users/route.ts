import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

async function verifyAdmin() {
  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  return user !== null && user.role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    // List all users ordered by createdAt descending
    const users = await User.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json({ success: false, error: 'Email and role are required' }, { status: 400 });
    }

    if (!['standard', 'pro', 'admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    await connectToDatabase();
    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
