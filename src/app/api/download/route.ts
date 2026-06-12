import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaUrl = searchParams.get('url');
    let filename = searchParams.get('filename') || 'download';

    if (!mediaUrl) {
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Standardize filename extension if missing
    try {
      const parsedUrl = new URL(mediaUrl);
      const pathname = parsedUrl.pathname;
      const extension = pathname.substring(pathname.lastIndexOf('.'));
      
      // If the filename parameter doesn't contain a dot, append extension
      if (!filename.includes('.') && extension.length > 1 && extension.length < 6) {
        filename += extension;
      }
    } catch {
      // Ignore URL parsing failure
    }

    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch media: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    // Read the file as a stream
    const fileStream = response.body;
    if (!fileStream) {
      return new NextResponse('Failed to read response body stream', { status: 500 });
    }

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Content-Type', contentType);
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    // Set caching headers to prevent re-downloads of the same session file
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(fileStream as any, {
      headers,
    });
  } catch (error: any) {
    console.error('Download proxy error:', error);
    return new NextResponse(error.message || 'Internal server error', { status: 500 });
  }
}
