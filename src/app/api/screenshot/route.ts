import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';

function getExecutablePath(): string | undefined {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  let browser: any = null;
  let ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  try {
    await connectToDatabase();
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
  }

  let targetUrl = 'Unknown';
  let screenshotDevice = 'desktop';

  try {
    const body = await request.json();
    const { url, device = 'desktop' } = body;
    targetUrl = url || targetUrl;
    screenshotDevice = device || screenshotDevice;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
    }

    // Determine viewport and user agent
    let width = 1920;
    let height = 1080;
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    let isMobile = false;
    let hasTouch = false;

    if (device === 'tablet') {
      width = 768;
      height = 1024;
      userAgent = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
    } else if (device === 'mobile') {
      width = 375;
      height = 812;
      userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
      isMobile = true;
      hasTouch = true;
    }

    const execPath = getExecutablePath();
    let screenshotBuffer: Buffer | null = null;
    let apiUsed = 'Puppeteer Local';

    if (execPath) {
      try {
        browser = await puppeteer.launch({
          executablePath: execPath,
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width, height, isMobile, hasTouch });
        await page.setUserAgent(userAgent);

        // Set a timeout of 15 seconds for navigation
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

        // Inject styles to hide scrollbars for cleaner screenshots
        await page.addStyleTag({
          content: 'body::-webkit-scrollbar { display: none; } body { -ms-overflow-style: none; scrollbar-width: none; }'
        });

        // Wait brief moment for dynamic animations
        await new Promise(r => setTimeout(r, 1000));

        const rawBuffer = await page.screenshot({
          type: 'png',
          fullPage: false
        });
        screenshotBuffer = Buffer.from(rawBuffer);
      } catch (puppeteerError) {
        console.warn('Local Puppeteer launch failed, trying Microlink fallback:', puppeteerError);
      } finally {
        if (browser) {
          await browser.close();
          browser = null;
        }
      }
    }

    // If local screenshot didn't succeed, trigger Microlink fallback
    if (!screenshotBuffer) {
      console.log(`Using Microlink Screenshot fallback for URL: ${url}`);
      apiUsed = 'Microlink API';
      const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&viewport.width=${width}&viewport.height=${height}&viewport.isMobile=${isMobile}`;
      const mRes = await fetch(microlinkUrl, { signal: AbortSignal.timeout(20000) });
      if (!mRes.ok) {
        throw new Error(`Microlink fallback returned status code: ${mRes.status}`);
      }
      const data = await mRes.json();
      if (data.status === 'success' && data.data?.screenshot?.url) {
        const imgRes = await fetch(data.data.screenshot.url, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) {
          throw new Error(`Failed to download fallback image: ${imgRes.status}`);
        }
        screenshotBuffer = Buffer.from(await imgRes.arrayBuffer());
      } else {
        throw new Error(data.message || 'Microlink API failed to generate screenshot');
      }
    }

    const base64Image = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    try {
      await ApiUsageLog.create({
        ip,
        action: 'screenshot',
        url: targetUrl,
        platform: 'website',
        apiUsed,
        status: 'success'
      });
    } catch (logErr) {}

    return NextResponse.json({
      success: true,
      device,
      imageDataUrl: base64Image
    });

  } catch (error: any) {
    console.error('Screenshot API error:', error);
    try {
      await ApiUsageLog.create({
        ip,
        action: 'screenshot',
        url: targetUrl,
        platform: 'website',
        apiUsed: 'Screenshot API',
        status: 'failed',
        errorMessage: error.message
      });
    } catch (logErr) {}

    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to capture screenshot. The site may be blocking automated requests.' 
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
