import { NextRequest, NextResponse } from 'next/server';

const COBALT_INSTANCES = [
  'https://api.cobalt.liubquanti.click',
  'https://cobaltapi.cjs.nz',
  'https://cobaltapi.kittycat.boo'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, downloadMode = 'video' } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
    }

    let resolvedUrl = null;
    let filename = 'media';
    let lastError = 'No instances responded';

    // Try instances in sequence
    for (const baseInstanceUrl of COBALT_INSTANCES) {
      try {
        const payload: Record<string, any> = {
          url: url
        };
        if (downloadMode === 'audio') {
          payload.downloadMode = 'audio';
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

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            resolvedUrl = data.url;
            filename = data.filename || filename;
            break;
          } else if (data.error) {
            lastError = data.error.code || 'Unknown cobalt error';
          }
        } else {
          lastError = `Status ${res.status}`;
        }
      } catch (err: any) {
        console.error(`Error on cobalt instance ${baseInstanceUrl}:`, err.message);
        lastError = err.message;
      }
    }

    if (resolvedUrl) {
      return NextResponse.json({
        success: true,
        downloadUrl: resolvedUrl,
        filename
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: `Failed to extract download link. Details: ${lastError}` 
    }, { status: 500 });

  } catch (error: any) {
    console.error('Download media API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
