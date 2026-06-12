import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

function getYoutubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export async function GET(request: NextRequest) {
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  try {
    await connectToDatabase();
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || '';

  if (!url) {
    return NextResponse.json({ success: false, error: 'url parameter is required' }, { status: 400 });
  }

  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return NextResponse.json({ success: false, error: 'Invalid YouTube video URL' }, { status: 400 });
  }

  try {
    console.log(`Fetching subtitles for YouTube video ID: ${videoId}`);
    
    // Fetch watch page to parse captions track list
    const watchPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!watchPageRes.ok) {
      throw new Error(`Failed to fetch YouTube watch page (status: ${watchPageRes.status})`);
    }

    const html = await watchPageRes.text();
    let ytData: any = null;

    try {
      const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
      if (match) {
        ytData = JSON.parse(match[1]);
      } else {
        const altMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*<\/script>/);
        if (altMatch) {
          ytData = JSON.parse(altMatch[1]);
        }
      }
    } catch (err: any) {
      console.error('Failed to parse ytInitialPlayerResponse:', err.message);
    }

    let subtitleUrl = '';
    const captionTracks = ytData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (captionTracks && captionTracks.length > 0) {
      // Prefer English, then auto-generated English, then first available
      const enTrack = captionTracks.find((t: any) => t.languageCode === 'en' && !t.vssId.startsWith('a.'));
      const autoEnTrack = captionTracks.find((t: any) => t.languageCode === 'en');
      const selectedTrack = enTrack || autoEnTrack || captionTracks[0];
      
      subtitleUrl = selectedTrack.baseUrl;
    }

    // Fallback: If watch page parsing failed, try calling public timedtext API directly
    if (!subtitleUrl) {
      subtitleUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
    }

    console.log(`Downloading subtitles from: ${subtitleUrl}`);
    const subtitleRes = await fetch(subtitleUrl, { signal: AbortSignal.timeout(8000) });
    if (!subtitleRes.ok) {
      throw new Error('No subtitles transcript found or failed to fetch transcript.');
    }

    const xml = await subtitleRes.text();
    
    // Parse Simple XML to SRT
    const textRegex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let index = 1;
    let srt = '';
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
      const startSecs = parseFloat(match[1]);
      const durSecs = parseFloat(match[2]);
      const endSecs = startSecs + durSecs;

      const startSrt = formatSrtTime(startSecs);
      const endSrt = formatSrtTime(endSecs);

      let text = match[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, '') // Strip internal html styling tags like <b> or <i>
        .trim();

      if (text) {
        srt += `${index}\n${startSrt} --> ${endSrt}\n${text}\n\n`;
        index++;
      }
    }

    if (!srt) {
      throw new Error('Subtitles are empty or could not be parsed.');
    }

    // Log success
    try {
      await ApiUsageLog.create({
        ip,
        action: 'download-subtitles',
        url: url,
        platform: 'youtube',
        apiUsed: 'YouTube Scraper',
        status: 'success'
      });
    } catch (logErr) {}

    // Return SRT
    return NextResponse.json({
      success: true,
      srt,
      videoId,
      title: ytData?.videoDetails?.title || 'youtube_subtitles'
    });

  } catch (error: any) {
    console.error('Subtitles extraction failed:', error.message);
    try {
      await ApiUsageLog.create({
        ip,
        action: 'download-subtitles',
        url: url,
        platform: 'youtube',
        apiUsed: 'YouTube Scraper',
        status: 'failed',
        errorMessage: error.message
      });
    } catch (logErr) {}

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
