import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

const COBALT_INSTANCES = [
  'https://cobaltapi.cjs.nz',
  'https://cobaltapi.kittycat.boo',
  'https://api.cobalt.liubquanti.click',
  'https://cobalt.drgns.space',
  'https://cobalt.moe/api',
  'https://cobalt.k6.vc',
  'https://cobalt.sh1nypanda.com'
];

function sanitizeUrl(urlStr: string): string {
  let c = urlStr.trim();
  if (!/^https?:\/\//i.test(c)) c = 'https://' + c;
  // If the URL has query parameters with '&' but is missing the starting '?' operator, replace the first '&' with '?'
  if (c.includes('&') && !c.includes('?')) {
    c = c.replace('&', '?');
  }
  return c;
}

export async function POST(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Auth gate check
  const { checkFeaturePermission } = await import('@/lib/auth');
  const permission = await checkFeaturePermission('download-media', ip);
  if (!permission.authorized) {
    return NextResponse.json({
      success: false,
      error: permission.limitReached 
        ? `Daily limit of ${permission.maxLimit} downloads reached. Please upgrade to unlock more!` 
        : 'Access Restricted',
      requiredLevel: permission.requiredLevel,
      limitReached: permission.limitReached
    }, { status: permission.limitReached ? 429 : 403 });
  }

  try {
    await connectToDatabase();
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
  }

  let requestUrl = 'Unknown';
  let requestMode = 'video';

  try {
    const body = await request.json();
    const { url, downloadMode = 'video', videoQuality, audioBitrate } = body;
    requestUrl = url || requestUrl;
    requestMode = downloadMode || requestMode;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
    }

    const sanitizedUrl = sanitizeUrl(url);
    let resolvedUrl = null;
    let filename = 'media';
    let lastError = 'No instances responded';

    // Try instances in sequence
    for (const baseInstanceUrl of COBALT_INSTANCES) {
      try {
        const payload: Record<string, any> = {
          url: sanitizedUrl,
          filenameStyle: 'basic'
        };
        
        if (downloadMode === 'audio') {
          payload.downloadMode = 'audio';
          payload.audioFormat = 'mp3';
          if (audioBitrate) {
            payload.audioBitrate = audioBitrate;
          }
        } else {
          payload.downloadMode = 'auto';
          if (videoQuality) {
            payload.videoQuality = videoQuality;
          }
        }

        const res = await fetch(baseInstanceUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000) // 10s timeout per instance
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {}

        if (res.ok && data) {
          if (data.url) {
            resolvedUrl = data.url;
            filename = data.filename || filename;
            break;
          } else if (data.error) {
            lastError = data.error.code || 'Unknown cobalt error';
          }
        } else {
          if (data && data.error && data.error.code) {
            lastError = data.error.code;
          } else {
            lastError = `Status ${res.status}`;
          }
        }
      } catch (err: any) {
        console.error(`Error on cobalt instance ${baseInstanceUrl}:`, err.message);
        lastError = err.message;
      }
    }

    if (resolvedUrl) {
      try {
        await ApiUsageLog.create({
          ip,
          action: `download-${downloadMode}`,
          url: sanitizedUrl,
          platform: 'youtube',
          apiUsed: 'Cobalt',
          status: 'success',
          userEmail: permission.user?.email
        });
      } catch (logErr) {
        console.error('Logging download success failed:', logErr);
      }

      return NextResponse.json({
        success: true,
        downloadUrl: resolvedUrl,
        filename
      });
    }

    try {
      await ApiUsageLog.create({
        ip,
        action: `download-${downloadMode}`,
        url: sanitizedUrl,
        platform: 'youtube',
        apiUsed: 'Cobalt',
        status: 'failed',
        errorMessage: lastError,
        userEmail: permission.user?.email
      });
    } catch (logErr) {
      console.error('Logging download failure failed:', logErr);
    }

    return NextResponse.json({ 
      success: false, 
      error: `Failed to extract download link. Details: ${lastError}` 
    }, { status: 500 });

  } catch (error: any) {
    console.error('Download media API error:', error);
    try {
      await ApiUsageLog.create({
        ip,
        action: `download-${requestMode}`,
        url: requestUrl,
        platform: 'youtube',
        apiUsed: 'Cobalt',
        status: 'failed',
        errorMessage: error.message,
        userEmail: permission.user?.email
      });
    } catch (logErr) {}
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
