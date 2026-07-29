import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    await connectToDatabase();
    const startOfToday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const scansCount = await ApiUsageLog.countDocuments({
      userEmail: user.email,
      timestamp: { $gte: startOfToday }
    });

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        scansCountToday: scansCount
      }
    });
  } catch (err: any) {
    console.error('Session verification error:', err);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
}
