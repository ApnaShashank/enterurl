import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';

export async function POST(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Auth gate check
  const { checkFeaturePermission } = await import('@/lib/auth');
  const permission = await checkFeaturePermission('remove-bg');
  if (!permission.authorized) {
    return NextResponse.json({
      success: false,
      error: 'Access Restricted',
      requiredLevel: permission.requiredLevel
    }, { status: 403 });
  }

  try {
    await connectToDatabase();
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
  }

  let targetImageUrl = 'Unknown';

  try {
    if (!REMOVE_BG_API_KEY) {
      return NextResponse.json({ success: false, error: 'Remove.bg API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { imageUrl } = body;
    targetImageUrl = imageUrl || targetImageUrl;

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'imageUrl is required' }, { status: 400 });
    }

    // Call Remove.bg API
    const formData = new URLSearchParams();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');
    formData.append('format', 'png');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(30000), // 30s timeout for remove.bg processing
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg error:', response.status, errorText);
      try {
        await ApiUsageLog.create({
          ip,
          action: 'remove-bg',
          url: targetImageUrl,
          platform: 'image',
          apiUsed: 'Remove.bg',
          status: 'failed',
          errorMessage: `Status ${response.status}: ${response.statusText}`,
          userEmail: permission.user?.email
        });
      } catch (logErr) {}

      return NextResponse.json({ success: false, error: `Remove.bg API error: ${response.statusText}` }, { status: response.status });
    }

    // Get binary PNG data
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // Get credits info from headers
    const creditsCharged = response.headers.get('X-Credits-Charged') || '1';
    const creditsFreeRemaining = response.headers.get('X-Free-Calls') || 'Unknown';

    try {
      await ApiUsageLog.create({
        ip,
        action: 'remove-bg',
        url: targetImageUrl,
        platform: 'image',
        apiUsed: 'Remove.bg',
        status: 'success',
        userEmail: permission.user?.email
      });
    } catch (logErr) {}

    return NextResponse.json({
      success: true,
      imageDataUrl: dataUrl,
      creditsCharged,
      creditsFreeRemaining,
    });

  } catch (error: any) {
    console.error('Remove.bg route error:', error);
    try {
      await ApiUsageLog.create({
        ip,
        action: 'remove-bg',
        url: targetImageUrl,
        platform: 'image',
        apiUsed: 'Remove.bg',
        status: 'failed',
        errorMessage: error.message,
        userEmail: permission.user?.email
      });
    } catch (logErr) {}
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
