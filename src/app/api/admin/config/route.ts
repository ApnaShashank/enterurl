import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import ApiConfig from '@/models/ApiConfig';

const DEFAULT_CONFIGS = [
  { featureName: 'analyze-intel', requiredLevel: 'registered' },
  { featureName: 'analyze-lighthouse', requiredLevel: 'free' },
  { featureName: 'analyze-ai-research', requiredLevel: 'registered' },
  { featureName: 'analyze-ai-writer', requiredLevel: 'pro' },
  { featureName: 'download-media', requiredLevel: 'free' },
  { featureName: 'transcribe', requiredLevel: 'registered' },
  { featureName: 'remove-bg', requiredLevel: 'pro' },
  { featureName: 'screenshot', requiredLevel: 'registered' }
];

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
    const dbConfigs = await ApiConfig.find({});
    
    // Merge database configurations with defaults
    const configs = DEFAULT_CONFIGS.map(def => {
      const dbMatch = dbConfigs.find(c => c.featureName === def.featureName);
      return {
        featureName: def.featureName,
        requiredLevel: dbMatch ? dbMatch.requiredLevel : def.requiredLevel
      };
    });

    return NextResponse.json({ success: true, configs });
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

    const { featureName, requiredLevel } = await request.json();
    if (!featureName || !requiredLevel) {
      return NextResponse.json({ success: false, error: 'Feature name and required level are required' }, { status: 400 });
    }

    if (!['free', 'registered', 'pro'].includes(requiredLevel)) {
      return NextResponse.json({ success: false, error: 'Invalid required level' }, { status: 400 });
    }

    await connectToDatabase();
    const updatedConfig = await ApiConfig.findOneAndUpdate(
      { featureName },
      { requiredLevel },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      config: {
        featureName: updatedConfig.featureName,
        requiredLevel: updatedConfig.requiredLevel
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
