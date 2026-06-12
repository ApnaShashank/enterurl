import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';

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
  let browser = null;
  try {
    const body = await request.json();
    const { url, device = 'desktop' } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL parameter is required' }, { status: 400 });
    }

    const execPath = getExecutablePath();
    if (!execPath) {
      return NextResponse.json({ 
        success: false, 
        error: 'No suitable local browser found (Chrome or Edge). Please install a browser on the server.' 
      }, { status: 500 });
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

    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false
    });

    const base64Image = `data:image/png;base64,${Buffer.from(screenshotBuffer).toString('base64')}`;

    return NextResponse.json({
      success: true,
      device,
      imageDataUrl: base64Image
    });

  } catch (error: any) {
    console.error('Screenshot API error:', error);
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
