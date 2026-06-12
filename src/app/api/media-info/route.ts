import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaUrl = searchParams.get('url');

    if (!mediaUrl) {
      return NextResponse.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
    }

    // Perform a HEAD request to get content length and content type
    const response = await fetch(mediaUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    });

    let contentType = response.headers.get('content-type') || 'unknown';
    let contentLength = response.headers.get('content-length') || '0';

    // If HEAD request is blocked, try GET with range or limited headers
    if (!response.ok || contentLength === '0') {
      const getResponse = await fetch(mediaUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Range': 'bytes=0-1',
        },
      });
      contentType = getResponse.headers.get('content-type') || contentType;
      contentLength = getResponse.headers.get('content-length') || contentLength;
    }

    return NextResponse.json({
      success: true,
      contentType,
      fileSize: parseInt(contentLength, 10),
    });

  } catch (error: any) {
    console.error('Media Info fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
