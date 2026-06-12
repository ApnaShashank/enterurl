import { NextRequest, NextResponse } from 'next/server';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    if (!REMOVE_BG_API_KEY) {
      return NextResponse.json({ success: false, error: 'Remove.bg API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { imageUrl } = body;

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
      return NextResponse.json({ success: false, error: `Remove.bg API error: ${response.statusText}` }, { status: response.status });
    }

    // Get binary PNG data
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // Get credits info from headers
    const creditsCharged = response.headers.get('X-Credits-Charged') || '1';
    const creditsFreeRemaining = response.headers.get('X-Free-Calls') || 'Unknown';

    return NextResponse.json({
      success: true,
      imageDataUrl: dataUrl,
      creditsCharged,
      creditsFreeRemaining,
    });

  } catch (error: any) {
    console.error('Remove.bg route error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
