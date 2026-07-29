import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

const COBALT_INSTANCES = [
  'https://cobaltapi.cjs.nz',
  'https://cobaltapi.kittycat.boo',
  'https://api.cobalt.liubquanti.click',
  'https://cobalt.drgns.space',
  'https://cobalt.moe/api',
  'https://cobalt.k6.vc',
  'https://cobalt.sh1nypanda.com'
];

// POST /api/transcribe — submit audio URL for transcription, return transcript_id
export async function POST(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Auth gate check
  const { checkFeaturePermission } = await import('@/lib/auth');
  const permission = await checkFeaturePermission('transcribe', ip);
  if (!permission.authorized) {
    return NextResponse.json({
      success: false,
      error: permission.limitReached 
        ? `Daily limit of ${permission.maxLimit} transcribes reached. Please upgrade to unlock more!` 
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

  let targetAudioUrl = 'Unknown';

  try {
    if (!ASSEMBLYAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { audioUrl } = body;
    targetAudioUrl = audioUrl || targetAudioUrl;

    if (!audioUrl) {
      return NextResponse.json({ success: false, error: 'audioUrl is required' }, { status: 400 });
    }

    // Resolve non-direct video/social platform audio link first via Cobalt
    let resolvedAudioUrl = audioUrl;
    const isDirectAudio = /\.(mp3|wav|ogg|aac|m4a|flac|wma|opus)(\?.*)?$/i.test(audioUrl);
    if (!isDirectAudio) {
      for (const baseInstanceUrl of COBALT_INSTANCES) {
        try {
          const res = await fetch(baseInstanceUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: audioUrl,
              downloadMode: 'audio',
              audioFormat: 'mp3',
              filenameStyle: 'basic'
            }),
            signal: AbortSignal.timeout(8000)
          });
          const data = await res.json();
          if (res.ok && data && data.url) {
            resolvedAudioUrl = data.url;
            break;
          }
        } catch (err: any) {
          console.error(`Cobalt resolve failed for ${baseInstanceUrl} during transcribe:`, err.message);
        }
      }
    }

    if (!isDirectAudio && resolvedAudioUrl === audioUrl) {
      return NextResponse.json({
        success: false,
        error: 'Failed to extract audio track from this video link. The extraction server may be rate-limited, or all public media download proxies are currently down.'
      }, { status: 502 });
    }

    // Try Deepgram first if key is configured (faster, synchronous)
    let deepgramSucceeded = false;
    let deepgramResult = null;

    if (DEEPGRAM_API_KEY) {
      try {
        console.log('Attempting transcription via Deepgram...');
        const deepgramRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: resolvedAudioUrl
          }),
          signal: AbortSignal.timeout(8000) // 8s timeout to prevent Vercel serverless timeout
        });

        if (deepgramRes.ok) {
          const dgData = await deepgramRes.json();
          const transcriptText = dgData.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
          const confidence = dgData.results?.channels?.[0]?.alternatives?.[0]?.confidence || null;
          const rawWords = dgData.results?.channels?.[0]?.alternatives?.[0]?.words || null;
          const words = rawWords ? rawWords.map((w: any) => ({
            text: w.punctuated_word || w.word,
            start: Math.round(w.start * 1000),
            end: Math.round(w.end * 1000)
          })) : null;

          if (transcriptText) {
            deepgramResult = {
              success: true,
              status: 'completed',
              text: transcriptText,
              confidence,
              words,
              apiUsed: 'Deepgram'
            };
            deepgramSucceeded = true;
          }
        } else {
          console.warn(`Deepgram API returned status ${deepgramRes.status}`);
        }
      } catch (dgErr: any) {
        console.error('Deepgram transcription failed or timed out:', dgErr.message);
      }
    }

    if (deepgramSucceeded && deepgramResult) {
      try {
        const { transliterateTextToHinglish, transliterateWordsListToHinglish } = await import('@/lib/transliterate');
        if (deepgramResult.text) {
          deepgramResult.text = await transliterateTextToHinglish(deepgramResult.text);
        }
        if (deepgramResult.words) {
          deepgramResult.words = await transliterateWordsListToHinglish(deepgramResult.words);
        }
      } catch (transErr) {
        console.error('Failed to transliterate Deepgram result:', transErr);
      }

      try {
        await ApiUsageLog.create({
          ip,
          action: 'transcribe',
          url: targetAudioUrl,
          platform: 'audio',
          apiUsed: 'Deepgram',
          status: 'success',
          userEmail: permission.user?.email
        });
      } catch (logErr) {}

      return NextResponse.json(deepgramResult);
    }

    // Fallback to AssemblyAI (Asynchronous, polled)
    // language_detection + code_switching enables Hinglish (Hindi+English mix) transcription
    const response = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: resolvedAudioUrl,
        language_detection: true,
        language_code: 'hi',
        punctuate: true,
        format_text: true,
        speech_model: 'best',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const err = await response.text();
      try {
        await ApiUsageLog.create({
          ip,
          action: 'transcribe',
          url: targetAudioUrl,
          platform: 'audio',
          apiUsed: 'AssemblyAI',
          status: 'failed',
          errorMessage: `Status ${response.status}: ${err}`,
          userEmail: permission.user?.email
        });
      } catch (logErr) {}

      return NextResponse.json({ success: false, error: `AssemblyAI submit error: ${err}` }, { status: 500 });
    }

    const data = await response.json();

    try {
      await ApiUsageLog.create({
        ip,
        action: 'transcribe',
        url: targetAudioUrl,
        platform: 'audio',
        apiUsed: 'AssemblyAI',
        status: 'success',
        userEmail: permission.user?.email
      });
    } catch (logErr) {}

    return NextResponse.json({ success: true, transcriptId: data.id, status: data.status });

  } catch (error: any) {
    console.error('Transcribe submit error:', error);
    try {
      await ApiUsageLog.create({
        ip,
        action: 'transcribe',
        url: targetAudioUrl,
        platform: 'audio',
        apiUsed: 'AssemblyAI',
        status: 'failed',
        errorMessage: error.message,
        userEmail: permission.user?.email
      });
    } catch (logErr) {}
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET /api/transcribe?id=TRANSCRIPT_ID — poll transcription status
export async function GET(request: NextRequest) {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AssemblyAI API key not configured' }, { status: 500 });
    }

    const { checkFeaturePermission } = await import('@/lib/auth');
    const permission = await checkFeaturePermission('transcribe');
    if (!permission.authorized) {
      return NextResponse.json({
        success: false,
        error: 'Access Restricted',
        requiredLevel: permission.requiredLevel
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('id');

    if (!transcriptId) {
      return NextResponse.json({ success: false, error: 'id parameter is required' }, { status: 400 });
    }

    const response = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
      headers: { 'Authorization': ASSEMBLYAI_API_KEY },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch transcript status' }, { status: 500 });
    }

    const data = await response.json();

    let text = data.text || null;
    let words = data.words || null;

    if (data.status === 'completed') {
      try {
        const { transliterateTextToHinglish, transliterateWordsListToHinglish } = await import('@/lib/transliterate');
        if (text) {
          text = await transliterateTextToHinglish(text);
        }
        if (words) {
          words = await transliterateWordsListToHinglish(words);
        }
      } catch (transErr) {
        console.error('Failed to transliterate AssemblyAI result:', transErr);
      }
    }

    return NextResponse.json({
      success: true,
      transcriptId: data.id,
      status: data.status, // queued | processing | completed | error
      text,
      words,
      confidence: data.confidence || null,
      duration: data.audio_duration || null,
      language: data.language_code || null,
      error: data.error || null,
    });

  } catch (error: any) {
    console.error('Transcribe poll error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
