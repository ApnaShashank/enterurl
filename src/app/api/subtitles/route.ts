import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';
import { YoutubeTranscript } from 'youtube-transcript';

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
    console.log(`Fetching subtitles for YouTube video ID: ${videoId} using youtube-transcript library`);
    
    // Fetch transcript using library
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('Subtitles are empty or could not be retrieved.');
    }

    // Convert to standard SRT
    let srt = '';
    transcriptItems.forEach((item, index) => {
      const startSecs = item.offset / 1000;
      const durSecs = item.duration / 1000;
      const endSecs = startSecs + durSecs;

      const startSrt = formatSrtTime(startSecs);
      const endSrt = formatSrtTime(endSecs);

      // Clean up text format
      let text = item.text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/<[^>]*>/g, '') // Strip html tags
        .trim();

      if (text) {
        srt += `${index + 1}\n${startSrt} --> ${endSrt}\n${text}\n\n`;
      }
    });

    if (!srt) {
      throw new Error('Subtitles parsing yielded an empty result.');
    }

    // Log success in DB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await ApiUsageLog.create({
          ip,
          action: 'download-subtitles',
          url: url,
          platform: 'youtube',
          apiUsed: 'YouTube Transcript Library',
          status: 'success'
        });
      } catch (logErr) {}
    }

    // Transliterate Devanagari Hindi text to Hinglish
    const { transliterateTextToHinglish } = await import('@/lib/transliterate');
    const hinglishSrt = await transliterateTextToHinglish(srt);

    // Return SRT
    return NextResponse.json({
      success: true,
      srt: hinglishSrt,
      videoId,
      title: 'YouTube Subtitles'
    });

  } catch (error: any) {
    console.error('Subtitles extraction failed:', error.message);
    
    // Log failure in DB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await ApiUsageLog.create({
          ip,
          action: 'download-subtitles',
          url: url,
          platform: 'youtube',
          apiUsed: 'YouTube Transcript Library',
          status: 'failed',
          errorMessage: error.message
        });
      } catch (logErr) {}
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
