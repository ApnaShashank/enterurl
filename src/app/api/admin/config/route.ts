import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import ApiConfig from '@/models/ApiConfig';

const DEFAULT_CONFIGS = [
  { featureName: 'analyze-base', requiredLevel: 'free', freeLimit: 10, registeredLimit: 50, proLimit: -1 },
  { featureName: 'analyze-intel', requiredLevel: 'registered', freeLimit: 0, registeredLimit: 30, proLimit: -1 },
  { featureName: 'analyze-lighthouse', requiredLevel: 'free', freeLimit: 10, registeredLimit: 40, proLimit: -1 },
  { featureName: 'analyze-ai-research', requiredLevel: 'registered', freeLimit: 0, registeredLimit: 10, proLimit: -1 },
  { featureName: 'analyze-ai-writer', requiredLevel: 'pro', freeLimit: 0, registeredLimit: 0, proLimit: 50 },
  { featureName: 'download-media', requiredLevel: 'free', freeLimit: 5, registeredLimit: 25, proLimit: -1 },
  { featureName: 'transcribe', requiredLevel: 'registered', freeLimit: 0, registeredLimit: 5, proLimit: 50 },
  { featureName: 'remove-bg', requiredLevel: 'pro', freeLimit: 0, registeredLimit: 0, proLimit: 20 },
  { featureName: 'screenshot', requiredLevel: 'registered', freeLimit: 0, registeredLimit: 15, proLimit: -1 }
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
        requiredLevel: dbMatch ? dbMatch.requiredLevel : def.requiredLevel,
        freeLimit: dbMatch && dbMatch.freeLimit !== undefined ? dbMatch.freeLimit : def.freeLimit,
        registeredLimit: dbMatch && dbMatch.registeredLimit !== undefined ? dbMatch.registeredLimit : def.registeredLimit,
        proLimit: dbMatch && dbMatch.proLimit !== undefined ? dbMatch.proLimit : def.proLimit
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

    const { featureName, requiredLevel, freeLimit, registeredLimit, proLimit } = await request.json();
    if (!featureName || !requiredLevel) {
      return NextResponse.json({ success: false, error: 'Feature name and required level are required' }, { status: 400 });
    }

    if (!['free', 'registered', 'pro'].includes(requiredLevel)) {
      return NextResponse.json({ success: false, error: 'Invalid required level' }, { status: 400 });
    }

    await connectToDatabase();
    const updatedConfig = await ApiConfig.findOneAndUpdate(
      { featureName },
      { 
        requiredLevel,
        freeLimit: freeLimit !== undefined ? parseInt(freeLimit, 10) : undefined,
        registeredLimit: registeredLimit !== undefined ? parseInt(registeredLimit, 10) : undefined,
        proLimit: proLimit !== undefined ? parseInt(proLimit, 10) : undefined
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      config: updatedConfig
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
