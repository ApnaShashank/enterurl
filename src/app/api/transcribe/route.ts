import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';
const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

// POST /api/transcribe — submit audio URL for transcription, return transcript_id
export async function POST(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
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

    const response = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true,
        punctuate: true,
        format_text: true,
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
          errorMessage: `Status ${response.status}: ${err}`
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
        status: 'success'
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
        errorMessage: error.message
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

    return NextResponse.json({
      success: true,
      transcriptId: data.id,
      status: data.status, // queued | processing | completed | error
      text: data.text || null,
      words: data.words || null,
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
