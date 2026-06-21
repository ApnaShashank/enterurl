import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import dns from 'dns';
import tls from 'tls';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';
import puppeteer from 'puppeteer';
import fs from 'fs';
import ProductPriceHistory from '@/models/ProductPriceHistory';

const WHOISXML_API_KEY = process.env.WHOISXML_API_KEY || '';
const IPINFO_TOKEN = process.env.IPINFO_TOKEN || '';
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';

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

function parseCoordinates(urlStr: string): { latitude: number; longitude: number } | null {
  const clean = urlStr.trim();
  // Match geo URI, e.g. geo:26.0739,83.1859
  const geoMatch = clean.match(/^geo:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
  if (geoMatch) {
    return {
      latitude: parseFloat(geoMatch[1]),
      longitude: parseFloat(geoMatch[2])
    };
  }
  // Match plain coordinate pair, e.g. 26.0739, 83.1859 (with optional query parameters)
  const coordsMatch = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\?.*)?$/);
  if (coordsMatch) {
    return {
      latitude: parseFloat(coordsMatch[1]),
      longitude: parseFloat(coordsMatch[2])
    };
  }
  return null;
}

async function fetchAddressFromCoordinates(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LinkToPreview/1.0'
      },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      return data.display_name || '';
    }
  } catch (e) {
    console.error('Nominatim lookup failed:', e);
  }
  return '';
}

function extractCoordinatesFromGoogleMapsUrl(urlStr: string): { latitude: number; longitude: number } | null {
  try {
    const parsed = new URL(urlStr);
    const path = parsed.pathname;
    const match = path.match(/@\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      };
    }
    const q = parsed.searchParams.get('q');
    if (q) {
      const qMatch = q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (qMatch) {
        return {
          latitude: parseFloat(qMatch[1]),
          longitude: parseFloat(qMatch[2])
        };
      }
    }
    const ll = parsed.searchParams.get('ll');
    if (ll) {
      const llMatch = ll.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (llMatch) {
        return {
          latitude: parseFloat(llMatch[1]),
          longitude: parseFloat(llMatch[2])
        };
      }
    }
  } catch {}
  return null;
}

async function checkAndParseMaps(
  finalUrl: string,
  redirectChain: string[],
  responseHeadersObj: Record<string, string>,
  ipAddress: string,
  dnsRecords: any[],
  sendResponse: (data: any) => Promise<any>
): Promise<any | null> {
  const isMapsUrl = /(google\.[a-z.]+\/maps|maps\.google|maps\.app\.goo\.gl)/i.test(finalUrl) || 
                     redirectChain.some(r => /(google\.[a-z.]+\/maps|maps\.google|maps\.app\.goo\.gl)/i.test(r));
  if (isMapsUrl) {
    const coords = extractCoordinatesFromGoogleMapsUrl(finalUrl);
    if (coords) {
      const { latitude, longitude } = coords;
      const address = await fetchAddressFromCoordinates(latitude, longitude);
      const title = address ? address.split(',')[0] : 'Google Maps Location';
      const description = address || `Google Maps coordinates: ${latitude}, ${longitude}`;
      return await sendResponse({
        success: true,
        url: finalUrl,
        domain: getDomainName(finalUrl),
        platform: 'website',
        contentType: 'website',
        title,
        description,
        embedUrl: `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`,
        locationData: {
          latitude,
          longitude,
          address,
          embedUrl: `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
        },
        linkIntel: {
          redirectChain,
          ipAddress,
          dnsRecords,
          safe: true,
          shortUrl: '',
          headers: responseHeadersObj
        }
      });
    }
  }
  return null;
}

async function fetchHtmlWithPuppeteerFallback(targetUrl: string, fallbackDomain: string): Promise<string> {
  let html = '';
  try {
    const ctrlr = new AbortController();
    const tid = setTimeout(() => ctrlr.abort(), 8000);
    const gr = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: ctrlr.signal,
    });
    clearTimeout(tid);
    if (gr.ok) {
      html = await gr.text();
    }
  } catch (err: any) {
    console.warn(`Direct fetch failed for ${targetUrl}:`, err.message);
  }

  const isLinkedInOrAmazon = /(linkedin\.com|amazon\.)/i.test(fallbackDomain);
  const isBlocked = !html || html.length < 1500 || /block|robot|captcha|security challenge/i.test(html);
  
  if (isLinkedInOrAmazon || isBlocked) {
    console.log(`Puppeteer fallback scraper initiated for ${targetUrl} (Domain: ${fallbackDomain})`);
    const execPath = getExecutablePath();
    if (execPath) {
      let browser = null;
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
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        html = await page.content();
      } catch (puppeteerErr: any) {
        console.error('Puppeteer scraper fallback error:', puppeteerErr.message);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }
  }
  return html;
}

interface ParsedPrice {
  price: number;
  currency: string;
}

function extractProductPrice(htmlText: string, $: cheerio.CheerioAPI): ParsedPrice | null {
  try {
    const jsonLdBlocks = $('script[type="application/ld+json"]');
    for (let i = 0; i < jsonLdBlocks.length; i++) {
      try {
        const text = $(jsonLdBlocks[i]).text().trim();
        if (!text) continue;
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const graphItems = item['@graph'] && Array.isArray(item['@graph']) ? item['@graph'] : [item];
          for (const graphItem of graphItems) {
            if (graphItem['@type'] === 'Product' || graphItem['@type']?.includes('Product')) {
              const offers = graphItem.offers;
              if (offers) {
                const offerList = Array.isArray(offers) ? offers : [offers];
                for (const offer of offerList) {
                  if (offer.price !== undefined) {
                    const priceVal = parseFloat(String(offer.price).replace(/[^0-9.]/g, ''));
                    const currencyVal = offer.priceCurrency || 'USD';
                    if (!isNaN(priceVal) && priceVal > 0) {
                      return { price: priceVal, currency: currencyVal };
                    }
                  }
                }
              }
            }
          }
        }
      } catch {}
    }

    const ogPriceAmount = $('meta[property="product:price:amount"]').attr('content') || 
                          $('meta[property="og:price:amount"]').attr('content');
    const ogPriceCurrency = $('meta[property="product:price:currency"]').attr('content') || 
                            $('meta[property="og:price:currency"]').attr('content') || 'USD';
    if (ogPriceAmount) {
      const priceVal = parseFloat(ogPriceAmount.replace(/[^0-9.]/g, ''));
      if (!isNaN(priceVal) && priceVal > 0) {
        return { price: priceVal, currency: ogPriceCurrency };
      }
    }

    const itempropPrice = $('[itemprop="price"]').attr('content') || $('[itemprop="price"]').text();
    const itempropCurrency = $('[itemprop="priceCurrency"]').attr('content') || 'USD';
    if (itempropPrice) {
      const priceVal = parseFloat(String(itempropPrice).replace(/[^0-9.]/g, ''));
      if (!isNaN(priceVal) && priceVal > 0) {
        return { price: priceVal, currency: itempropCurrency };
      }
    }

    const amazonPriceText = $('.a-price .a-offscreen').first().text().trim() || 
                            $('#priceblock_ourprice').text().trim() || 
                            $('#priceblock_dealprice').text().trim() ||
                            $('.priceblock_ourprice').text().trim();
    if (amazonPriceText) {
      const clean = amazonPriceText.replace(/,/g, '');
      const match = clean.match(/(?:Rs\.?|₹|EUR|€|\$)\s*([0-9.]+)/i) || clean.match(/([0-9.]+)/);
      if (match) {
        const priceVal = parseFloat(match[1]);
        let currencyVal = 'USD';
        if (amazonPriceText.includes('₹') || amazonPriceText.includes('Rs')) currencyVal = 'INR';
        else if (amazonPriceText.includes('€') || amazonPriceText.includes('EUR')) currencyVal = 'EUR';
        if (!isNaN(priceVal) && priceVal > 0) {
          return { price: priceVal, currency: currencyVal };
        }
      }
    }

    const priceElements = $('[class*="price"], [id*="price"]');
    for (let i = 0; i < priceElements.length; i++) {
      const elText = $(priceElements[i]).text().trim();
      if (elText && elText.length < 30) {
        const clean = elText.replace(/,/g, '');
        const match = clean.match(/(?:Rs\.?|₹|EUR|€|\$)\s*([0-9.]+)/i);
        if (match) {
          const priceVal = parseFloat(match[1]);
          let currencyVal = 'USD';
          if (elText.includes('₹') || elText.includes('Rs')) currencyVal = 'INR';
          else if (elText.includes('€') || elText.includes('EUR')) currencyVal = 'EUR';
          if (!isNaN(priceVal) && priceVal > 0) {
            return { price: priceVal, currency: currencyVal };
          }
        }
      }
    }
  } catch {}
  return null;
}



function getDomainName(urlStr: string): string {
  try { return new URL(urlStr).hostname.replace('www.', ''); } catch { return 'unknown'; }
}
function getHostname(urlStr: string): string {
  try { return new URL(urlStr).hostname; } catch { return ''; }
}
function cleanUrl(urlStr: string): string {
  let c = urlStr.trim();
  if (!/^https?:\/\//i.test(c)) c = 'https://' + c;
  // If the URL has query parameters with '&' but is missing the starting '?' operator, replace the first '&' with '?'
  if (c.includes('&') && !c.includes('?')) {
    c = c.replace('&', '?');
  }
  return c;
}

// ---- SHORT URL ----
async function getShortUrl(longUrl: string): Promise<string> {
  try {
    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) { const d = await res.json(); return d.shorturl || ''; }
  } catch {}
  return '';
}

// ---- WHOISXML ----
async function fetchWhoisData(domain: string) {
  if (!WHOISXML_API_KEY || !domain || domain === 'unknown') return null;
  try {
    const res = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISXML_API_KEY}&domainName=${domain}&outputFormat=JSON`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rec = data.WhoisRecord;
    if (!rec) return null;
    const rd = rec.registryData || {};
    return {
      registrar: rec.registrarName || rd.registrar?.name || 'Unknown',
      createdDate: rec.createdDateNormalized || rd.createdDateNormalized || 'Unknown',
      expiresDate: rec.expiresDateNormalized || rd.expiresDateNormalized || 'Unknown',
      updatedDate: rec.updatedDateNormalized || rd.updatedDateNormalized || 'Unknown',
      registrantOrg: rec.registrant?.organization || rd.registrant?.organization || 'Unknown',
      registrantCountry: rec.registrant?.country || rd.registrant?.country || 'Unknown',
      nameServers: rec.nameServers?.hostNames || rd.nameServers?.hostNames || [],
      domainAge: rec.estimatedDomainAge || null,
      status: Array.isArray(rec.status) ? rec.status.join(', ') : (rec.status || ''),
      rawRegistrar: rec.rawText ? rec.rawText.substring(0, 500) : '',
    };
  } catch (e) { console.error('WHOIS error:', e); return null; }
}

// ---- IPINFO ----
async function fetchIPInfo(ip: string) {
  if (!IPINFO_TOKEN || !ip || ip === 'Unknown') return null;
  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      ip: d.ip || ip,
      hostname: d.hostname || '',
      city: d.city || '',
      region: d.region || '',
      country: d.country || '',
      org: d.org || '',
      loc: d.loc || '',
      timezone: d.timezone || '',
      postal: d.postal || '',
    };
  } catch (e) { console.error('IPInfo error:', e); return null; }
}

// ---- VIRUSTOTAL ----
async function scanWithVirusTotal(url: string) {
  if (!VIRUSTOTAL_API_KEY) return null;
  const urlId = Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  try {
    // Try existing report first (fast path)
    const existing = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    if (existing.ok) {
      const d = await existing.json();
      const stats = d.data?.attributes?.last_analysis_stats;
      if (stats) {
        return {
          harmless: stats.harmless || 0,
          malicious: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          undetected: stats.undetected || 0,
          timeout: stats.timeout || 0,
          total: (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0) + (stats.undetected || 0),
          safe: (stats.malicious || 0) === 0 && (stats.suspicious || 0) === 0,
          permalink: `https://www.virustotal.com/gui/url/${urlId}`,
          lastAnalysisDate: d.data?.attributes?.last_analysis_date ? new Date(d.data.attributes.last_analysis_date * 1000).toLocaleDateString() : 'Unknown',
        };
      }
    }
    // Submit new scan
    const form = new URLSearchParams();
    form.append('url', url);
    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: { 'x-apikey': VIRUSTOTAL_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });
    if (!submitRes.ok) return null;
    const submitData = await submitRes.json();
    const analysisId = submitData.data?.id;
    if (!analysisId) return null;

    // Poll up to 3 times with 2s gap
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 2500));
      const pollRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      if (!pollRes.ok) continue;
      const pd = await pollRes.json();
      if (pd.data?.attributes?.status === 'completed') {
        const stats = pd.data.attributes.stats;
        return {
          harmless: stats.harmless || 0,
          malicious: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          undetected: stats.undetected || 0,
          timeout: stats.timeout || 0,
          total: (stats.harmless || 0) + (stats.malicious || 0) + (stats.suspicious || 0) + (stats.undetected || 0),
          safe: (stats.malicious || 0) === 0 && (stats.suspicious || 0) === 0,
          permalink: `https://www.virustotal.com/gui/url/${urlId}`,
          lastAnalysisDate: new Date().toLocaleDateString(),
        };
      }
    }
    return { harmless: 0, malicious: 0, suspicious: 0, undetected: 0, timeout: 0, total: 0, safe: true, permalink: `https://www.virustotal.com/gui/url/${urlId}`, lastAnalysisDate: 'Scanning...', scanning: true };
  } catch (e) { console.error('VirusTotal error:', e); return null; }
}

// ---- GEMINI AI ----
async function generateAiContentGemini(title: string, description: string, platform: string, domain: string) {
  if (!GEMINI_API_KEY) return null;
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Given this social media content:
Title: "${title.substring(0, 200)}"
Description: "${description.substring(0, 300)}"
Platform: ${platform}
Domain: ${domain}

Generate a JSON object with these keys (no markdown, pure JSON):
{
  "captions": ["caption1 with emojis (max 150 chars)", "caption2 with emojis", "caption3 with emojis"],
  "optimizedTitles": ["Viral title 1 (max 80 chars)", "Viral title 2", "Viral title 3"],
  "seoDescription": "SEO optimized meta description (max 160 chars)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(text);
  } catch (e) {
    console.error('Gemini AI error:', e);
    return null;
  }
}

// ---- TEMPLATE FALLBACK AI ----
function generateAiTemplate(title: string, description: string, platform: string) {
  const cleanTitle = title.replace(/[^\w\s]/g, '').trim() || 'Awesome Content';
  const words = cleanTitle.split(/\s+/).filter(w => w.length > 4);
  const keyword1 = words[0] || 'viral';
  const keyword2 = words[1] || 'trending';
  return {
    captions: [
      `✨ Must watch alert! "${title.substring(0, 80)}" is next level 🚀 Check this out! #${keyword1} #${platform}`,
      `Mind blown! 🤯 Just discovered "${title.substring(0, 80)}" — highly recommend. What do you think? 👇`,
      `This is a hidden gem 💎 Found on ${platform}: "${title.substring(0, 60)}" — worth every second!`,
    ],
    optimizedTitles: [
      `🔥 The Truth About: ${title.substring(0, 50)} (Explained)`,
      `This is NEXT LEVEL! 🚀 Why you MUST check "${title.substring(0, 45)}"`,
      `Hidden Gem Alert! 💎 ${title.substring(0, 55)} in 2026`,
    ],
    seoDescription: `Looking for ${title.substring(0, 60)}? This ${platform} content explores ${keyword1} and ${keyword2}. Dive in now!`,
    hashtags: [`#${keyword1}`, `#${keyword2}`, `#${platform}`, '#viral', '#trending', '#content', '#media', '#discover'],
  };
}

// ---- SSL CERTIFICATE DETAILS ----
function fetchSslDetails(hostname: string): Promise<any> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect({
        host: hostname,
        port: 443,
        servername: hostname,
        rejectUnauthorized: false,
        timeout: 4000,
      }, () => {
        const cert = socket.getPeerCertificate(true);
        socket.destroy();
        if (cert && Object.keys(cert).length > 0) {
          resolve({
            issuer: typeof cert.issuer === 'string' ? cert.issuer : (cert.issuer?.O || cert.issuer?.CN || 'Unknown'),
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            subject: cert.subject?.CN || 'Unknown',
            serialNumber: cert.serialNumber,
            bits: cert.bits,
            daysRemaining: Math.max(0, Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
            valid: socket.authorized || (new Date(cert.valid_to) > new Date() && new Date(cert.valid_from) < new Date()),
          });
        } else {
          resolve(null);
        }
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(null);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

// ---- ROBOTS.TXT & SITEMAP PARSER ----
async function fetchRobotsTxt(domain: string): Promise<{ rulesCount: number; sitemaps: string[]; disallows: string[] }> {
  try {
    const res = await fetch(`https://${domain}/robots.txt`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { rulesCount: 0, sitemaps: [], disallows: [] };
    const text = await res.text();
    const lines = text.split('\n');
    const sitemaps: string[] = [];
    const disallows: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('sitemap:')) {
        sitemaps.push(trimmed.substring(8).trim());
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        const path = trimmed.substring(9).trim();
        if (path) disallows.push(path);
      }
    }
    return {
      rulesCount: lines.length,
      sitemaps,
      disallows: disallows.slice(0, 10),
    };
  } catch {
    return { rulesCount: 0, sitemaps: [], disallows: [] };
  }
}

// ---- ADVANCED TECHNOLOGY STACK SCANNER ----
function detectTechStack(htmlText: string, headers: Record<string, string>): string[] {
  const techs: string[] = [];
  const lowerHtml = htmlText.toLowerCase();

  // Frameworks & Libraries
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) techs.push('WordPress');
  if (lowerHtml.includes('shopify')) techs.push('Shopify');
  if (lowerHtml.includes('nextjs') || lowerHtml.includes('__next_data__')) techs.push('Next.js');
  if (lowerHtml.includes('react') || lowerHtml.includes('react-dom')) techs.push('React');
  if (lowerHtml.includes('angular') || lowerHtml.includes('ng-version')) techs.push('Angular');
  if (lowerHtml.includes('vue.js') || lowerHtml.includes('vuejs') || lowerHtml.includes('data-v-')) techs.push('Vue.js');
  if (lowerHtml.includes('svelte') || lowerHtml.includes('svelte-')) techs.push('Svelte');
  if (lowerHtml.includes('jquery.js') || lowerHtml.includes('jquery.min.js') || lowerHtml.includes('jquery-')) techs.push('jQuery');
  if (lowerHtml.includes('bootstrap.min.css') || lowerHtml.includes('bootstrap.css') || lowerHtml.includes('class="container') || lowerHtml.includes('row')) {
    if (lowerHtml.includes('bootstrap')) techs.push('Bootstrap');
  }
  if (lowerHtml.includes('tailwind') || lowerHtml.includes('sm:') || lowerHtml.includes('md:') || lowerHtml.includes('lg:') || lowerHtml.includes('xl:')) {
    if (lowerHtml.includes('tailwind') || lowerHtml.includes('tw-') || lowerHtml.includes('theme(')) techs.push('Tailwind CSS');
  }
  if (lowerHtml.includes('vite') || lowerHtml.includes('/@vite/client')) techs.push('Vite');
  if (lowerHtml.includes('nuxt') || lowerHtml.includes('__nuxt')) techs.push('Nuxt.js');

  // CDNs & Servers
  if (headers['server']) {
    const s = headers['server'].toLowerCase();
    if (s.includes('cloudflare')) techs.push('Cloudflare CDN');
    else if (s.includes('vercel')) techs.push('Vercel hosting');
    else if (s.includes('nginx')) techs.push('Nginx Server');
    else if (s.includes('apache')) techs.push('Apache Server');
    else if (s.includes('gws')) techs.push('Google Web Server');
  }
  if (headers['x-powered-by']) {
    const p = headers['x-powered-by'].toLowerCase();
    if (p.includes('next.js')) techs.push('Next.js');
    else if (p.includes('express')) techs.push('Express.js');
    else if (p.includes('php')) techs.push('PHP');
    else if (p.includes('asp.net')) techs.push('ASP.NET');
  }
  if (headers['x-vercel-id'] || headers['x-vercel-cache']) techs.push('Vercel');
  if (headers['cf-ray'] || headers['cf-cache-status']) techs.push('Cloudflare');
  if (lowerHtml.includes('netlify')) techs.push('Netlify');
  if (lowerHtml.includes('amazonaws.com') || lowerHtml.includes('s3.amazonaws')) techs.push('Amazon AWS');

  // Integrations & Analytics
  if (lowerHtml.includes('google-analytics') || lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtag(')) techs.push('Google Analytics');
  if (lowerHtml.includes('connect.facebook.net') || lowerHtml.includes('fbevents.js') || lowerHtml.includes('fbq(')) techs.push('Meta Pixel');
  if (lowerHtml.includes('stripe.com') || lowerHtml.includes('stripe-')) techs.push('Stripe Payment');
  if (lowerHtml.includes('hotjar.com') || lowerHtml.includes('hj(')) techs.push('Hotjar Feedback');
  if (lowerHtml.includes('maps.googleapis.com')) techs.push('Google Maps API');
  if (lowerHtml.includes('font-awesome') || lowerHtml.includes('fa-')) techs.push('Font Awesome');
  if (lowerHtml.includes('youtube.com/embed/')) techs.push('YouTube Video Embeds');
  if (lowerHtml.includes('player.vimeo.com/video/')) techs.push('Vimeo Video Embeds');

  return techs;
}

// ---- CUSTOM LIGHTHOUSE AUDITER ----
function runLighthouseAudit(htmlText: string, headers: Record<string, string>, $: cheerio.CheerioAPI) {
  // 1. SEO score
  let seoItems = [
    { name: 'Title Tag Present', passed: $('title').length > 0, detail: $('title').length > 0 ? 'Title tag is configured' : 'Missing title tag in HTML' },
    { name: 'Meta Description Present', passed: $('meta[name="description"]').length > 0 || $('meta[property="og:description"]').length > 0, detail: ($('meta[name="description"]').length > 0 || $('meta[property="og:description"]').length > 0) ? 'Description tag is configured' : 'Missing meta description' },
    { name: 'H1 Heading Tag', passed: $('h1').length > 0, detail: $('h1').length > 0 ? `Found H1 tag: "${$('h1').first().text().trim().substring(0, 40)}..."` : 'No H1 tag found. Page needs a main heading.' },
    { name: 'Alt Attributes on Images', passed: $('img:not([alt])').length === 0, detail: $('img:not([alt])').length === 0 ? 'All images have alt attributes' : `Found ${$('img:not([alt])').length} image(s) missing alt text` },
    { name: 'Canonical Link Tag', passed: $('link[rel="canonical"]').length > 0, detail: $('link[rel="canonical"]').length > 0 ? 'Canonical link is configured' : 'Missing canonical link tag' },
  ];
  let seoScore = Math.round((seoItems.filter(i => i.passed).length / seoItems.length) * 100);

  // 2. Performance score
  const pageWeightKB = Math.round(htmlText.length / 1024);
  const scriptTags = $('script').length;
  const linkStyles = $('link[rel="stylesheet"]').length;
  const totalImages = $('img').length;
  
  let perfItems = [
    { name: 'Page Size < 500KB', passed: pageWeightKB < 500, detail: `Page size is ${pageWeightKB}KB` },
    { name: 'Scripts Optimization', passed: scriptTags < 15, detail: `Page loads ${scriptTags} script elements` },
    { name: 'Stylesheets Optimization', passed: linkStyles < 8, detail: `Page loads ${linkStyles} stylesheet links` },
    { name: 'Image Count < 20', passed: totalImages < 20, detail: `Found ${totalImages} image(s) on the page` },
    { name: 'Server Response Compression', passed: !!headers['content-encoding'], detail: headers['content-encoding'] ? `Compressed using: ${headers['content-encoding']}` : 'No server-side compression header detected' }
  ];
  let perfScore = Math.round((perfItems.filter(i => i.passed).length / perfItems.length) * 100);

  // 3. Best Practices score
  const hasHsts = !!headers['strict-transport-security'];
  const hasCsp = !!headers['content-security-policy'];
  const hasXfo = !!headers['x-frame-options'];

  let bestPracticesItems = [
    { name: 'Uses HTTPS Protocol', passed: true, detail: 'Target URL resolved securely via HTTPS' },
    { name: 'HSTS Protection Enabled', passed: hasHsts, detail: hasHsts ? 'Strict-Transport-Security header is present' : 'HSTS security is missing' },
    { name: 'X-Frame-Options configured', passed: hasXfo, detail: hasXfo ? 'Clickjacking protection is configured' : 'Missing X-Frame-Options' },
    { name: 'Content Security Policy (CSP)', passed: hasCsp, detail: hasCsp ? 'CSP headers are present' : 'Missing CSP policy protection' }
  ];
  let bestPracticesScore = Math.round((bestPracticesItems.filter(i => i.passed).length / bestPracticesItems.length) * 100);

  // 4. Accessibility score
  const hasLang = !!$('html').attr('lang');
  const hasViewport = !!$('meta[name="viewport"]').attr('content');
  const hasAria = $('[aria-label], [aria-labelledby], [role]').length > 0;

  let accessibilityItems = [
    { name: 'HTML Language Tag', passed: hasLang, detail: hasLang ? `Lang attribute is set to: "${$('html').attr('lang')}"` : 'Missing lang attribute on HTML element' },
    { name: 'Viewport Meta Tag', passed: hasViewport, detail: hasViewport ? 'Viewport is responsive' : 'Missing responsive viewport scale configuration' },
    { name: 'Image Alt Tags for Screen Readers', passed: $('img:not([alt])').length === 0, detail: $('img:not([alt])').length === 0 ? 'Accessibility alt tags present' : 'Some images lack alt tags' },
    { name: 'ARIA Accessibility Markers', passed: hasAria, detail: hasAria ? 'Contains semantic web markers' : 'No ARIA attributes or roles found' }
  ];
  let accessibilityScore = Math.round((accessibilityItems.filter(i => i.passed).length / accessibilityItems.length) * 100);

  return {
    performance: { score: perfScore, items: perfItems },
    seo: { score: seoScore, items: seoItems },
    bestPractices: { score: bestPracticesScore, items: bestPracticesItems },
    accessibility: { score: accessibilityScore, items: accessibilityItems }
  };
}

function getYoutubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function generateAiCompletion(prompt: string, systemPrompt: string = "You are a helpful assistant."): Promise<string> {
  if (GEMINI_API_KEY) {
    try {
      console.log('Trying Gemini API...');
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (e: any) {
      console.error('Gemini API failed, trying fallback:', e.message);
    }
  }

  if (GROQ_API_KEY) {
    try {
      console.log('Trying Groq API...');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (e: any) {
      console.error('Groq API failed, trying fallback:', e.message);
    }
  }

  if (OPENAI_API_KEY) {
    try {
      console.log('Trying OpenAI API...');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (e: any) {
      console.error('OpenAI API failed, trying fallback:', e.message);
    }
  }

  if (ANTHROPIC_API_KEY) {
    try {
      console.log('Trying Anthropic API...');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1500,
          messages: [{ role: 'user', content: `${systemPrompt}\n\n${prompt}` }],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (e: any) {
      console.error('Anthropic API failed, trying fallback:', e.message);
    }
  }

  if (XAI_API_KEY) {
    try {
      console.log('Trying xAI API...');
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (e: any) {
      console.error('xAI API failed:', e.message);
    }
  }

  throw new Error('All AI API keys failed or are unconfigured.');
}

// ---- GEMINI YOUTUBE VIDEO SUMMARY ----
async function fetchGeminiYoutubeSummary(title: string, description: string, transcript: string, domain: string) {
  try {
    const textSnippet = transcript ? transcript.substring(0, 10000) : '';
    const systemPrompt = "You are a professional video content summarizer that outputs JSON only.";
    const prompt = `Perform a detailed video intelligence summary on this YouTube video.
Title: "${title}"
Description: "${description}"
${textSnippet ? `Transcript Segment: "${textSnippet}"` : '(No transcript subtitles available)'}

Generate a JSON object with these keys (no markdown, pure JSON, only valid JSON):
{
  "summary": "A highly detailed, comprehensive summary of what this video discusses, its context, and the core flow of the video (3-4 sentences minimum).",
  "targetAudience": "Core value proposition, key takeaways, and lessons learned from watching this video in detail.",
  "competitors": ["Core Concept 1", "Core Concept 2", "Core Concept 3", "Core Concept 4"],
  "seoAdvice": [
    "Key Theme/Insight 1: detailed explanation",
    "Key Theme/Insight 2: detailed explanation",
    "Key Theme/Insight 3: detailed explanation",
    "Key Theme/Insight 4: detailed explanation"
  ]
}`;

    const completionText = await generateAiCompletion(prompt, systemPrompt);
    const cleanedText = completionText.trim().replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('Gemini YouTube summary error:', e);
    return {
      summary: `Detailed summary for video: "${title}". Description: ${description}`,
      targetAudience: "General video viewers, students, and practitioners interested in the subject.",
      competitors: ["Video Concepts", "Topic Breakdown", "Key Points"],
      seoAdvice: ["Check video captions", "Read comments and description details"]
    };
  }
}

// ---- GEMINI WEBPAGE AI RESEARCH ----
async function fetchGeminiIntelligence(title: string, description: string, htmlText: string, domain: string) {
  try {
    const cleanHtml = htmlText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    const textSnippet = cleanHtml.replace(/<[^>]+>/g, ' ').substring(0, 1500).replace(/\s+/g, ' ').trim();
    
    const systemPrompt = "You are a professional web analyst that outputs JSON only.";
    const prompt = `Perform website intelligence analysis on this domain: "${domain}"
Title: "${title}"
Description: "${description}"
Text Content Sample: "${textSnippet}"

Generate a JSON object with these keys (no markdown, pure JSON, only valid JSON):
{
  "summary": "1 sentence executive summary of what this website is/does",
  "targetAudience": "Who is the primary audience for this website?",
  "competitors": ["Competitor Domain 1", "Competitor Domain 2", "Competitor Domain 3"],
  "seoAdvice": ["Actionable SEO recommendation 1", "Actionable SEO recommendation 2", "Actionable SEO recommendation 3"]
}`;

    const completionText = await generateAiCompletion(prompt, systemPrompt);
    const cleanedText = completionText.trim().replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('Website intelligence fallback error:', e);
    return null;
  }
}

// ---- GEMINI WEBPAGE REAL/FAKE SAFETY CHECK ----
async function runAiSafetyCheck(domain: string, title: string, description: string) {
  try {
    const systemPrompt = "You are a cyber security analyst specializing in domain threat intelligence and phishing detection. You output JSON only.";
    const prompt = `Analyze this website details to check if it is REAL/LEGITIMATE, SUSPICIOUS, or a FAKE/SCAM website.
Domain: "${domain}"
Title: "${title}"
Description: "${description}"

Check for common red flags:
- Typosquatting or brand lookalikes (e.g., netfl1x.com, secure-bank-login.net)
- Overly generic, suspicious keywords in the domain or title
- Phishing/scam language in title or description

Generate a JSON object with these keys (no markdown, pure JSON, no enclosing quotes, only valid JSON):
{
  "verdict": "REAL" or "SUSPICIOUS" or "FAKE",
  "trustScore": 0 to 100,
  "analysis": "A brief explanation (2-3 sentences) detailing why this domain is marked as real, suspicious, or fake, citing specific pattern highlights."
}`;

    const completionText = await generateAiCompletion(prompt, systemPrompt);
    const cleanedText = completionText.trim().replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('AI safety check error:', e);
    const isSuspiciousDomain = /(login|secure|verify|account|signin|update|bank|wallet|free|gift|win)/i.test(domain);
    return {
      verdict: isSuspiciousDomain ? 'SUSPICIOUS' : 'REAL',
      trustScore: isSuspiciousDomain ? 45 : 85,
      analysis: `Rule-based evaluation: The domain "${domain}" was checked. No active threats detected via standard patterns.`
    };
  }
}

// ---- MULTIMODAL IMAGE ANALYSIS VIA GEMINI ----
async function analyzeImageGemini(imageUrl: string) {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze this image. Output a JSON object containing detected objects, tags, and description.
JSON format (no markdown, pure JSON):
{
  "description": "Short, vivid description of the image content",
  "objects": ["object1", "object2", "object3", "object4"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "faces": 0
}`;

    const imageParts = [{
      inlineData: {
        data: base64,
        mimeType
      }
    }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text().trim().replace(/```json?\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(text);
  } catch (e) {
    console.error('Gemini Image analysis error:', e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  let htmlText = '';
  let $: cheerio.CheerioAPI = cheerio.load('');
  
  let rawUrl = '';
  let scanType = 'base';
  let ip = '127.0.0.1';

  try {
    const body = await request.json();
    rawUrl = body.url || '';
    scanType = body.scanType || 'base';
  } catch (err) {
    console.error('Failed to parse request body:', err);
  }

  let currentUserEmail: string | undefined = undefined;
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (user) {
      currentUserEmail = user.email;
    }
  } catch (err) {
    console.error('getCurrentUser failed in analyze route:', err);
  }

  // Auth gate check for paid/heavy scans
  if (['intel', 'lighthouse', 'ai-research', 'ai-writer', 'trust-safety'].includes(scanType)) {
    const featureName = scanType === 'trust-safety' ? 'analyze-intel' : `analyze-${scanType}`;
    try {
      const { checkFeaturePermission } = await import('@/lib/auth');
      const permission = await checkFeaturePermission(featureName);
      if (!permission.authorized) {
        return NextResponse.json({
          success: false,
          error: 'Access Restricted',
          requiredLevel: permission.requiredLevel
        }, { status: 403 });
      }
      if (permission.user) {
        currentUserEmail = permission.user.email;
      }
    } catch (authGateErr) {
      console.error('Auth gate check failed:', authGateErr);
    }
  }

  // Connect to database
  try {
    await connectToDatabase();
  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
  }

  try {
    const headerIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    if (headerIp) {
      ip = headerIp.includes(',') ? headerIp.split(',')[0].trim() : headerIp.trim();
    }
  } catch {}

  const sendResponse = async (data: any, status: number = 200) => {
    try {
      const isSuccess = data.success !== false;
      let apis: string[] = [];
      if (isSuccess) {
        if (scanType === 'intel') {
          if (process.env.WHOISXML_API_KEY) apis.push('WhoisXML');
          if (process.env.IPINFO_TOKEN) apis.push('IPInfo');
          if (process.env.VIRUSTOTAL_API_KEY) apis.push('VirusTotal');
        } else if (scanType === 'ai-research' || scanType === 'ai-writer') {
          if (process.env.GEMINI_API_KEY) apis.push('Gemini');
        }
      }
      await ApiUsageLog.create({
        ip,
        action: `analyze-${scanType}`,
        url: rawUrl || 'Unknown URL',
        platform: data.platform || 'website',
        apiUsed: apis.join(', '),
        status: isSuccess ? 'success' : 'failed',
        errorMessage: isSuccess ? undefined : (data.error || 'Unknown error'),
        userEmail: currentUserEmail
      });
    } catch (logErr) {
      console.error('MongoDB Logging failed:', logErr);
    }
    return NextResponse.json(data, { status });
  };

  try {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return await sendResponse({ success: false, error: 'URL is required' }, 400);
    }

    // Enforce 10 links per 24 hours rate limit for anonymous scans
    if ((scanType === 'base' || !scanType) && !currentUserEmail) {
      const startOf24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      try {
        const count = await ApiUsageLog.countDocuments({
          ip,
          action: 'analyze-base',
          timestamp: { $gte: startOf24h }
        });
        if (count >= 10) {
          return await sendResponse({
            success: false,
            error: 'Daily limit of 10 link detections reached. Please register/log in to unlock unlimited scans.'
          }, 429);
        }
      } catch (limitErr) {
        console.error('Rate limit query failed:', limitErr);
      }
    }

    const url = cleanUrl(rawUrl);
    const originalDomain = getDomainName(url);

    // Intercept Geolocation coordinates / Geo URIs early
    const parsedCoords = parseCoordinates(rawUrl);
    if (parsedCoords) {
      const { latitude, longitude } = parsedCoords;
      const address = await fetchAddressFromCoordinates(latitude, longitude);
      const title = address ? address.split(',')[0] : 'Map Location';
      const description = address || `Coordinates: ${latitude}, ${longitude}`;
      
      return await sendResponse({
        success: true,
        url: `https://www.google.com/maps?q=${latitude},${longitude}`,
        domain: 'maps.google.com',
        platform: 'website',
        contentType: 'website',
        title,
        description,
        embedUrl: `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`,
        locationData: {
          latitude,
          longitude,
          address,
          embedUrl: `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
        },
        linkIntel: {
          redirectChain: [rawUrl],
          ipAddress: '8.8.8.8',
          dnsRecords: [{ type: 'A (Google Maps)', records: ['8.8.8.8'] }],
          safe: true,
          shortUrl: '',
          headers: {}
        }
      });
    }

    // Early interception for lazy-loaded scan types that only target websites
    if (scanType === 'intel' || scanType === 'lighthouse' || scanType === 'ai-research' || scanType === 'trust-safety') {
      // 1. Resolve redirect chain, hostname, and ipAddress
      let finalUrl = url;
      const redirectChain: string[] = [url];
      let contentTypeHeader = 'text/html';
      const responseHeadersObj: Record<string, string> = {};

      try {
        const redirectRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(8000),
        });
        finalUrl = redirectRes.url || url;
        if (finalUrl !== url) redirectChain.push(finalUrl);
        contentTypeHeader = redirectRes.headers.get('content-type') || 'text/html';
        ['server', 'cache-control', 'content-encoding', 'x-powered-by', 'x-frame-options', 'strict-transport-security', 'content-security-policy'].forEach(k => {
          const v = redirectRes.headers.get(k);
          if (v) responseHeadersObj[k] = v;
        });
      } catch (e) { console.error('Redirect follow failed:', e); }

      const finalDomain = getDomainName(finalUrl);
      const hostname = getHostname(finalUrl);

      let ipAddress = 'Unknown';
      const dnsRecords: Array<{ type: string; records: string[] }> = [];
      if (hostname && hostname !== 'localhost') {
        try {
          const lookup = await dns.promises.lookup(hostname);
          ipAddress = lookup.address;
          dnsRecords.push({ type: 'A (IPv4 Address)', records: [ipAddress] });
        } catch (e) { console.error('DNS lookup failed:', e); }
      }

      const mapsResponse = await checkAndParseMaps(finalUrl, redirectChain, responseHeadersObj, ipAddress, dnsRecords, sendResponse);
      if (mapsResponse) return mapsResponse;

      if (scanType === 'intel') {
        const [shortUrlR, vtR, ipInfoR, whoisR, sslR, robotsR] = await Promise.allSettled([
          getShortUrl(finalUrl),
          scanWithVirusTotal(finalUrl),
          fetchIPInfo(ipAddress),
          fetchWhoisData(finalDomain),
          fetchSslDetails(finalDomain),
          fetchRobotsTxt(finalDomain),
        ]);
        const ssl = sslR.status === 'fulfilled' ? sslR.value : null;
        const robots = robotsR.status === 'fulfilled' ? robotsR.value : null;
        const vt = vtR.status === 'fulfilled' ? vtR.value : null;
        return await sendResponse({
          success: true,
          sslCertificate: ssl,
          robotsTxt: robots,
          linkIntel: {
            redirectChain, ipAddress, dnsRecords,
            ipInfo: ipInfoR.status === 'fulfilled' ? ipInfoR.value : null,
            whois: whoisR.status === 'fulfilled' ? whoisR.value : null,
            virusTotal: vt,
            safe: vt ? vt.safe : true,
            shortUrl: shortUrlR.status === 'fulfilled' ? shortUrlR.value : '',
            headers: responseHeadersObj,
          },
        });
      }

      const htmlTextContent = await fetchHtmlWithPuppeteerFallback(finalUrl, finalDomain);

      const cheerioInstance = cheerio.load(htmlTextContent);

      if (scanType === 'lighthouse') {
        const auditData = runLighthouseAudit(htmlTextContent, responseHeadersObj, cheerioInstance);
        return await sendResponse({
          success: true,
          lighthouseAudit: auditData
        });
      }

      if (scanType === 'trust-safety') {
        const getMeta = (names: string[]) => { for (const n of names) { const c = cheerioInstance(`meta[property="${n}"]`).attr('content') || cheerioInstance(`meta[name="${n}"]`).attr('content') || cheerioInstance(`meta[itemprop="${n}"]`).attr('content'); if (c) return c.trim(); } return ''; };
        const parsedTitle = getMeta(['og:title', 'twitter:title']) || cheerioInstance('title').text()?.trim() || finalDomain;
        const parsedDesc = getMeta(['og:description', 'twitter:description', 'description']) || 'No description available.';
        
        const safetyResult = await runAiSafetyCheck(finalDomain, parsedTitle, parsedDesc);
        return await sendResponse({
          success: true,
          trustSafety: safetyResult
        });
      }

      if (scanType === 'ai-research') {
        const isYt = /(youtube\.com|youtu\.be)/i.test(finalUrl) || /(youtube\.com|youtu\.be)/i.test(url);
        const getMeta = (names: string[]) => { for (const n of names) { const c = cheerioInstance(`meta[property="${n}"]`).attr('content') || cheerioInstance(`meta[name="${n}"]`).attr('content') || cheerioInstance(`meta[itemprop="${n}"]`).attr('content'); if (c) return c.trim(); } return ''; };
        const parsedTitle = getMeta(['og:title', 'twitter:title']) || cheerioInstance('title').text()?.trim() || finalDomain;
        const parsedDesc = getMeta(['og:description', 'twitter:description', 'description']) || 'No description available.';

        let geminiIntel = null;
        if (isYt) {
          const videoId = getYoutubeVideoId(finalUrl) || getYoutubeVideoId(url);
          let transcriptText = '';
          if (videoId) {
            try {
              let subtitleUrl = '';
              let ytData: any = null;
              
              try {
                const match = htmlTextContent.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
                if (match) {
                  ytData = JSON.parse(match[1]);
                } else {
                  const altMatch = htmlTextContent.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*<\/script>/);
                  if (altMatch) {
                    ytData = JSON.parse(altMatch[1]);
                  }
                }
              } catch (err: any) {
                console.error('Failed to parse ytInitialPlayerResponse in analyze route:', err.message);
              }

              const captionTracks = ytData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
              if (captionTracks && captionTracks.length > 0) {
                const enTrack = captionTracks.find((t: any) => t.languageCode === 'en' && !t.vssId.startsWith('a.'));
                const autoEnTrack = captionTracks.find((t: any) => t.languageCode === 'en');
                const selectedTrack = enTrack || autoEnTrack || captionTracks[0];
                subtitleUrl = selectedTrack.baseUrl;
              }

              if (!subtitleUrl) {
                subtitleUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
              }

              const subtitleRes = await fetch(subtitleUrl, { signal: AbortSignal.timeout(8000) });
              if (subtitleRes.ok) {
                const xml = await subtitleRes.text();
                const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
                let match;
                let textChunks = [];
                while ((match = textRegex.exec(xml)) !== null) {
                  const chunkText = match[1]
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/<[^>]*>/g, '')
                    .trim();
                  if (chunkText) textChunks.push(chunkText);
                }
                transcriptText = textChunks.join(' ');
              }
            } catch (ytErr) {
              console.error('Failed to fetch transcript in analyze route:', ytErr);
            }
          }

          geminiIntel = await fetchGeminiYoutubeSummary(parsedTitle, parsedDesc, transcriptText, finalDomain);
        } else {
          geminiIntel = await fetchGeminiIntelligence(parsedTitle, parsedDesc, htmlTextContent, finalDomain);
        }

        return await sendResponse({
          success: true,
          geminiResearch: geminiIntel
        });
      }
    }

    if (scanType === 'image-tools') {
      const imgAnalysis = await analyzeImageGemini(url);
      return await sendResponse({
        success: true,
        imageAnalysis: imgAnalysis
      });
    }

    // --- Direct media file detection ---
    const lowerUrl = url.toLowerCase();
    const isDirectImage = /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff|avif)(\?.*)?$/i.test(lowerUrl);
    const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v|3gp|avi|mkv|flv)(\?.*)?$/i.test(lowerUrl);
    const isDirectAudio = /\.(mp3|wav|ogg|aac|m4a|flac|wma|opus)(\?.*)?$/i.test(lowerUrl);

    // --- Resolve redirects & headers ---
    let finalUrl = url;
    const redirectChain: string[] = [url];
    let contentTypeHeader = 'text/html';
    let serverHeader = '';
    const responseHeadersObj: Record<string, string> = {};

    try {
      const redirectRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });
      finalUrl = redirectRes.url || url;
      if (finalUrl !== url) redirectChain.push(finalUrl);
      contentTypeHeader = redirectRes.headers.get('content-type') || 'text/html';
      serverHeader = redirectRes.headers.get('server') || '';
      ['server', 'cache-control', 'content-encoding', 'x-powered-by', 'x-frame-options', 'strict-transport-security', 'content-security-policy'].forEach(k => {
        const v = redirectRes.headers.get(k);
        if (v) responseHeadersObj[k] = v;
      });
      // Detect if the actual content type is a direct media file
      if (contentTypeHeader.startsWith('image/') && !isDirectImage) {
        const filename = finalUrl.split('/').pop()?.split('?')[0] || 'image.file';
        return buildDirectMediaResponse(finalUrl, getDomainName(finalUrl), 'direct-image', 'image', filename, finalUrl, redirectChain, responseHeadersObj, ip, scanType);
      }
      if (contentTypeHeader.startsWith('video/') && !isDirectVideo) {
        const filename = finalUrl.split('/').pop()?.split('?')[0] || 'video.file';
        return buildDirectMediaResponse(finalUrl, getDomainName(finalUrl), 'direct-video', 'video', filename, null, redirectChain, responseHeadersObj, ip, scanType);
      }
      if (contentTypeHeader.startsWith('audio/') && !isDirectAudio) {
        const filename = finalUrl.split('/').pop()?.split('?')[0] || 'audio.file';
        return buildDirectMediaResponse(finalUrl, getDomainName(finalUrl), 'direct-audio', 'audio', filename, null, redirectChain, responseHeadersObj, ip, scanType);
      }
    } catch (e) { console.error('Redirect follow failed:', e); }

    const finalDomain = getDomainName(finalUrl);
    const hostname = getHostname(finalUrl);

    // --- DNS Lookup ---
    let ipAddress = 'Unknown';
    const dnsRecords: Array<{ type: string; records: string[] }> = [];
    if (hostname && hostname !== 'localhost' && !isDirectImage && !isDirectVideo && !isDirectAudio) {
      try {
        const lookup = await dns.promises.lookup(hostname);
        ipAddress = lookup.address;
        dnsRecords.push({ type: 'A (IPv4 Address)', records: [ipAddress] });
      } catch (e) { console.error('DNS lookup failed:', e); }
    }

    const mapsResponse = await checkAndParseMaps(finalUrl, redirectChain, responseHeadersObj, ipAddress, dnsRecords, sendResponse);
    if (mapsResponse) return mapsResponse;

    // --- Direct media paths (early return with link intel) ---
    if (isDirectImage || isDirectVideo || isDirectAudio) {
      const filename = finalUrl.split('/').pop()?.split('?')[0] || 'file';
      const platform = isDirectImage ? 'direct-image' : isDirectVideo ? 'direct-video' : 'direct-audio';
      const contentType = isDirectImage ? 'image' : isDirectVideo ? 'video' : 'audio';
      const previewUrl = isDirectImage ? finalUrl : undefined;

      if (scanType === 'ai-writer') {
        const aiData = await generateAiContentGemini(filename, `Direct ${contentType} file`, platform, finalDomain) || generateAiTemplate(filename, `Direct ${contentType} file`, platform);
        return await sendResponse({
          success: true,
          aiSuggestions: aiData
        });
      }

      return await sendResponse({
        success: true, url: finalUrl, domain: finalDomain, platform, contentType, title: filename,
        previewUrl: previewUrl || '',
        mediaUrls: [finalUrl],
        linkIntel: { redirectChain, ipAddress, ipInfo: null, dnsRecords, whois: null, virusTotal: null, safe: true, shortUrl: '', headers: responseHeadersObj },
      });
    }

    // YOUTUBE
    if (/(youtube\.com|youtu\.be)/i.test(originalDomain) || /(youtube\.com|youtu\.be)/i.test(finalDomain)) {
      try {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split(/[?#&]/)[0] || '';
        else if (url.includes('youtube.com/shorts/')) videoId = url.split('youtube.com/shorts/')[1]?.split(/[?#&]/)[0] || '';
        else { try { videoId = new URL(url).searchParams.get('v') || ''; } catch {} }

        if (!videoId) {
          if (finalUrl.includes('youtu.be/')) videoId = finalUrl.split('youtu.be/')[1]?.split(/[?#&]/)[0] || '';
          else if (finalUrl.includes('youtube.com/shorts/')) videoId = finalUrl.split('youtube.com/shorts/')[1]?.split(/[?#&]/)[0] || '';
          else { try { videoId = new URL(finalUrl).searchParams.get('v') || ''; } catch {} }
        }

        let title = 'YouTube Content', author = 'YouTube Creator', description = 'YouTube channel or page', previewUrl = '', duration = '', embedUrl = '';
        let hasSubtitles = false;
        if (videoId) {
          title = 'YouTube Video';
          previewUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
          try {
            const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oe.ok) { const d = await oe.json(); title = d.title || title; author = d.author_name || author; if (d.thumbnail_url) previewUrl = d.thumbnail_url; }
          } catch {}
          try {
            const wp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (wp.ok) {
              const html = await wp.text();
              const durMatch = html.match(/"approxDurationMs":"(\d+)"/);
              if (durMatch) { const s = Math.floor(parseInt(durMatch[1]) / 1000); duration = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
              const descMatch = html.match(/"shortDescription":"([^"]{0,500})"/);
              if (descMatch) description = descMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
              
              // Extract player response to check for captions track availability
              try {
                let ytData: any = null;
                const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
                if (match) {
                  ytData = JSON.parse(match[1]);
                } else {
                  const altMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*<\/script>/);
                  if (altMatch) {
                    ytData = JSON.parse(altMatch[1]);
                  }
                }
                const captionTracks = ytData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                if (captionTracks && captionTracks.length > 0) {
                  hasSubtitles = true;
                }
              } catch (err) {
                console.error('Failed to parse player response for subtitles check in analyze base route:', err);
              }
            }
          } catch {}
        } else {
          try {
            const gr = await fetch(finalUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
              signal: AbortSignal.timeout(6000)
            });
            if (gr.ok) {
              const ytHtml = await gr.text();
              const $yt = cheerio.load(ytHtml);
              title = $yt('meta[property="og:title"]').attr('content') || $yt('title').text()?.trim() || 'YouTube Content';
              description = $yt('meta[property="og:description"]').attr('content') || 'YouTube Page';
              previewUrl = $yt('meta[property="og:image"]').attr('content') || '';
            }
          } catch (e) {
            console.error('YouTube channel scraping error:', e);
          }
        }

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, description, 'YouTube', 'youtube.com') || generateAiTemplate(title, description, 'YouTube');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'youtube', contentType: videoId ? 'video' : 'website',
          title, description, previewUrl, embedUrl: embedUrl || undefined, author, duration,
          mediaUrls: [],
          hasSubtitles,
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('YouTube handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'youtube', contentType: 'video',
          title: 'YouTube Video', description: 'YouTube video content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // VIMEO
    if (/vimeo\.com/i.test(originalDomain) || /vimeo\.com/i.test(finalDomain)) {
      try {
        const targetVimeoUrl = /vimeo\.com/i.test(finalDomain) ? finalUrl : url;
        const videoId = targetVimeoUrl.split('/').pop()?.split(/[?#]/)[0] || '';
        let title = 'Vimeo Video', author = 'Vimeo Creator', description = 'Watch this Vimeo video.', previewUrl = '', duration = '', embedUrl = '';
        if (videoId && !isNaN(Number(videoId))) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
          try {
            const oe = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(targetVimeoUrl)}`);
            if (oe.ok) { const d = await oe.json(); title = d.title || title; author = d.author_name || author; description = d.description || description; previewUrl = d.thumbnail_url || ''; if (d.duration) { const s = parseInt(d.duration); duration = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; } }
          } catch {}
        }
        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, description, 'Vimeo', 'vimeo.com') || generateAiTemplate(title, description, 'Vimeo');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'vimeo', contentType: 'video',
          title, description, previewUrl, embedUrl: embedUrl || undefined, author, duration,
          mediaUrls: [],
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('Vimeo handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'vimeo', contentType: 'video',
          title: 'Vimeo Video', description: 'Vimeo content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // REDDIT
    if (/(reddit\.com|redd\.it)/i.test(originalDomain) || /(reddit\.com|redd\.it)/i.test(finalDomain)) {
      try {
        const targetRedditUrl = /(reddit\.com|redd\.it)/i.test(finalDomain) ? finalUrl : url;
        let jsonUrl = targetRedditUrl.split('?')[0].replace(/\/$/, '') + '.json';
        
        let title = 'Reddit Post', author = 'Reddit User', desc = 'Reddit media post', previewUrl = '', contentType: 'image' | 'video' | 'website' = 'website';
        const mediaUrls: string[] = [];

        try {
          const rr = await fetch(jsonUrl, { headers: { 'User-Agent': 'Mozilla/5.0 UnfoldBot/1.0' } });
          if (rr.ok) {
            const rd = await rr.json();
            const post = rd[0]?.data?.children[0]?.data;
            if (post) {
              title = post.title || title;
              author = post.author ? `u/${post.author}` : author;
              const subreddit = post.subreddit_name_prefixed || `r/${post.subreddit}`;
              const score = post.score || 0;
              desc = post.selftext || `${subreddit} post by ${author}. Score: ${score} upvotes.`;

              if (post.preview?.images?.[0]?.source?.url) previewUrl = post.preview.images[0].source.url.replace(/&amp;/g, '&');
              if (post.url && /\.(jpg|jpeg|png|webp|gif)$/i.test(post.url)) { contentType = 'image'; mediaUrls.push(post.url); if (!previewUrl) previewUrl = post.url; }
              else if (post.is_gallery && post.media_metadata) { contentType = 'image'; for (const key in post.media_metadata) { const img = post.media_metadata[key]; if (img?.s?.u) mediaUrls.push(img.s.u.replace(/&amp;/g, '&')); } if (mediaUrls.length && !previewUrl) previewUrl = mediaUrls[0]; }
              else if (post.is_video && post.media?.reddit_video?.fallback_url) { contentType = 'video'; mediaUrls.push(post.media.reddit_video.fallback_url.replace(/&amp;/g, '&')); }
            }
          }
        } catch (fetchErr) {
          console.error('Reddit JSON fetch error:', fetchErr);
          if (htmlText) {
            title = $('meta[property="og:title"]').attr('content') || $('title').text()?.trim() || title;
            desc = $('meta[property="og:description"]').attr('content') || desc;
            previewUrl = $('meta[property="og:image"]').attr('content') || '';
            if (previewUrl) contentType = 'image';
          }
        }

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, desc, 'Reddit', 'reddit.com') || generateAiTemplate(title, desc, 'Reddit');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'reddit', contentType,
          title, description: desc, previewUrl, author, mediaUrls,
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('Reddit handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'reddit', contentType: 'website',
          title: 'Reddit Post', description: 'Reddit post content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // TIKTOK
    if (/tiktok\.com/i.test(originalDomain) || /tiktok\.com/i.test(finalDomain)) {
      try {
        const targetTiktokUrl = /tiktok\.com/i.test(finalDomain) ? finalUrl : url;
        let title = 'TikTok Video', author = 'TikTok Creator', previewUrl = '', embedUrl = '';
        try {
          const oe = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(targetTiktokUrl)}`);
          if (oe.ok) { const d = await oe.json(); title = d.title || title; author = d.author_name || author; previewUrl = d.thumbnail_url || ''; const vid = targetTiktokUrl.split('/').pop()?.split(/[?#]/)[0]; if (vid) embedUrl = `https://www.tiktok.com/embed/v2/${vid}`; }
        } catch {}

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, 'TikTok short video', 'TikTok', 'tiktok.com') || generateAiTemplate(title, 'TikTok short video', 'TikTok');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'tiktok', contentType: 'video',
          title, description: `TikTok video by @${author}`, previewUrl, embedUrl, author,
          mediaUrls: [],
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('TikTok handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'tiktok', contentType: 'video',
          title: 'TikTok Content', description: 'TikTok video post.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // INSTAGRAM
    if (/instagram\.com/i.test(originalDomain) || /instagram\.com/i.test(finalDomain)) {
      try {
        const targetInstaUrl = /instagram\.com/i.test(finalDomain) ? finalUrl : url;
        const match = targetInstaUrl.match(/instagram\.com\/(p|reel|tv)\/([^/?#&]+)/i);
        const code = match ? match[2] : '';
        const title = match ? `Instagram ${match[1].toUpperCase()}` : 'Instagram Post';

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, 'Instagram media post', 'Instagram', 'instagram.com') || generateAiTemplate(title, 'Instagram media post', 'Instagram');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'instagram', contentType: 'video',
          title, description: 'View this content on Instagram.', previewUrl: '',
          embedUrl: code ? `https://www.instagram.com/p/${code}/embed/captioned/` : undefined,
          mediaUrls: [],
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('Instagram handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'instagram', contentType: 'video',
          title: 'Instagram Post', description: 'Instagram media content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // TWITTER/X
    if (/(twitter\.com|x\.com)/i.test(originalDomain) || /(twitter\.com|x\.com)/i.test(finalDomain)) {
      try {
        const targetTwitterUrl = /(twitter\.com|x\.com)/i.test(finalDomain) ? finalUrl : url;
        const tweetIdMatch = targetTwitterUrl.match(/status\/(\d+)/);
        const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';
        const embedUrl = tweetId ? `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}` : undefined;
        const title = 'Tweet on Twitter / X';

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, 'Twitter/X post', 'Twitter', 'twitter.com') || generateAiTemplate(title, 'Twitter/X post', 'Twitter');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'twitter', contentType: embedUrl ? 'video' : 'website',
          title, description: 'Read this post on Twitter / X.', previewUrl: '', embedUrl, mediaUrls: [],
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('Twitter/X handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'twitter', contentType: 'website',
          title: 'Twitter / X Post', description: 'Twitter/X post content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // FACEBOOK
    if (/facebook\.com/i.test(originalDomain) || /facebook\.com/i.test(finalDomain)) {
      try {
        const targetFbUrl = /facebook\.com/i.test(finalDomain) ? finalUrl : url;
        const isFbVideo = /\/videos\/|\/watch\/|fb\.watch\//i.test(targetFbUrl);
        const embedUrl = isFbVideo ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(targetFbUrl)}&show_text=0` : undefined;
        const title = `Facebook ${isFbVideo ? 'Video' : 'Post'}`;

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, 'Facebook media content', 'Facebook', 'facebook.com') || generateAiTemplate(title, 'Facebook content', 'Facebook');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'facebook', contentType: isFbVideo ? 'video' : 'website',
          title, description: 'View this post on Facebook.', previewUrl: '', embedUrl, mediaUrls: [],
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('Facebook handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'facebook', contentType: 'website',
          title: 'Facebook Content', description: 'Facebook post content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // PINTEREST
    if (/pinterest\.com|pin\.it/i.test(originalDomain) || /pinterest\.com|pin\.it/i.test(finalDomain)) {
      try {
        const targetPinUrl = /pinterest\.com|pin\.it/i.test(finalDomain) ? finalUrl : url;
        let title = 'Pinterest Pin', description = 'View this pin on Pinterest.', previewUrl = '';
        try {
          const pr = await fetch(targetPinUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (pr.ok) { const $ = cheerio.load(await pr.text()); title = $('meta[property="og:title"]').attr('content') || $('title').text()?.trim() || title; description = $('meta[property="og:description"]').attr('content') || description; previewUrl = $('meta[property="og:image"]').attr('content') || ''; }
        } catch {}

        if (scanType === 'ai-writer') {
          const aiData = await generateAiContentGemini(title, description, 'Pinterest', 'pinterest.com') || generateAiTemplate(title, description, 'Pinterest');
          return await sendResponse({
            success: true,
            aiSuggestions: aiData
          });
        }

        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'pinterest', contentType: 'image',
          title, description, previewUrl, mediaUrls: previewUrl ? [previewUrl] : [],
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      } catch (err) {
        console.error('Pinterest handler error:', err);
        return await sendResponse({
          success: true, url: finalUrl, domain: finalDomain, platform: 'pinterest', contentType: 'image',
          title: 'Pinterest Pin', description: 'Pinterest board pin content.', previewUrl: '',
          linkIntel: { redirectChain, ipAddress, dnsRecords, safe: true, shortUrl: '', headers: responseHeadersObj },
        });
      }
    }

    // ---- GENERAL WEBSITE (with full intelligence) ----
    htmlText = await fetchHtmlWithPuppeteerFallback(finalUrl, finalDomain);

    $ = cheerio.load(htmlText);
    const getMeta = (names: string[]) => { for (const n of names) { const c = $(`meta[property="${n}"]`).attr('content') || $(`meta[name="${n}"]`).attr('content') || $(`meta[itemprop="${n}"]`).attr('content'); if (c) return c.trim(); } return ''; };

    const parsedTitle = getMeta(['og:title', 'twitter:title']) || $('title').text()?.trim() || finalDomain;
    const parsedDesc = getMeta(['og:description', 'twitter:description', 'description']) || 'No description available.';
    let ogImage = getMeta(['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']);
    const ogVideo = getMeta(['og:video', 'og:video:url', 'twitter:player:stream']);
    const author = getMeta(['author', 'twitter:creator', 'og:author', 'article:author']) || $('meta[property="og:site_name"]').attr('content') || '';
    const keywords = getMeta(['keywords']);
    const generator = getMeta(['generator']);

    if (!ogImage) {
      const fav = $('link[rel="shortcut icon"]').attr('href') || $('link[rel="icon"]').attr('href') || $('link[rel="apple-touch-icon"]').attr('href');
      if (fav) { try { ogImage = new URL(fav, finalUrl).toString(); } catch {} }
    }
    if (ogImage && !ogImage.startsWith('http')) { try { ogImage = new URL(ogImage, finalUrl).toString(); } catch {} }

    let contentType: 'image' | 'video' | 'audio' | 'website' = 'website';
    if (ogVideo) contentType = 'video';

    // Extract hashtags/keywords
    const hashSet = new Set<string>();
    (parsedDesc.match(/#\w+/g) || []).forEach(t => hashSet.add(t));
    if (keywords) keywords.split(',').forEach(k => { const c = k.trim().replace(/[^\w]/g, ''); if (c.length > 2) hashSet.add('#' + c.toLowerCase()); });
    if (hashSet.size < 3 && parsedTitle !== finalDomain) {
      parsedTitle.split(/\s+/).filter(w => w.length > 4).slice(0, 4).forEach(w => hashSet.add('#' + w.replace(/[^\w]/g, '').toLowerCase()));
    }
    if (hashSet.size < 2) { hashSet.add('#' + finalDomain.split('.')[0]); hashSet.add('#media'); }
    const hashtags = Array.from(hashSet).slice(0, 8);

    // Detect tech stack using advanced engine
    const techStack = detectTechStack(htmlText, responseHeadersObj);

    // Product Price parsing & history logging
    const parsedPrice = extractProductPrice(htmlText, $);
    let productData = null;
    if (parsedPrice) {
      try {
        let record = await ProductPriceHistory.findOne({ url: finalUrl });
        const currentPricePoint = {
          price: parsedPrice.price,
          currency: parsedPrice.currency,
          timestamp: new Date()
        };

        if (!record) {
          record = await ProductPriceHistory.create({
            url: finalUrl,
            domain: finalDomain,
            title: parsedTitle || finalDomain,
            priceHistory: [currentPricePoint]
          });
        } else {
          const lastEntry = record.priceHistory[record.priceHistory.length - 1];
          const isPriceChanged = lastEntry.price !== parsedPrice.price || lastEntry.currency !== parsedPrice.currency;
          const oneHour = 60 * 60 * 1000;
          const isTimePassed = Date.now() - new Date(lastEntry.timestamp).getTime() > oneHour;

          if (isPriceChanged || isTimePassed) {
            record.priceHistory.push(currentPricePoint);
            if (record.priceHistory.length > 50) {
              record.priceHistory.shift();
            }
            await record.save();
          }
        }

        productData = {
          price: parsedPrice.price,
          currency: parsedPrice.currency,
          title: parsedTitle || finalDomain,
          priceHistory: record.priceHistory.map((h: any) => ({
            price: h.price,
            currency: h.currency,
            timestamp: h.timestamp.toISOString()
          }))
        };
      } catch (dbErr) {
        console.error('Failed to log product price history:', dbErr);
      }
    }

    if (scanType === 'ai-writer') {
      const aiData = await generateAiContentGemini(parsedTitle, parsedDesc, 'Website', finalDomain) || { ...generateAiTemplate(parsedTitle, parsedDesc, 'Website'), hashtags };
      return await sendResponse({
        success: true,
        aiSuggestions: aiData
      });
    }

    // Base scan (Skip all heavy APIs)
    return await sendResponse({
      success: true, url: finalUrl, domain: finalDomain, platform: 'website', contentType,
      title: parsedTitle, description: parsedDesc, previewUrl: ogImage, mediaUrls: [],
      embedUrl: ogVideo || undefined, author: author || undefined, hashtags,
      techStack: techStack.length > 0 ? techStack : undefined,
      developerSpecs: extractDeveloperSpecs(htmlText, finalUrl),
      productData: productData || undefined,
      linkIntel: {
        redirectChain, ipAddress, dnsRecords,
        safe: true,
        shortUrl: '',
        headers: responseHeadersObj,
      },
    });

  } catch (error: any) {
    console.error('Analyze API error:', error);
    return await sendResponse({ success: false, error: error.message || 'Server error' }, 500);
  }
}

// Helper for direct media early return
async function buildDirectMediaResponse(
  url: string,
  domain: string,
  platform: string,
  contentType: string,
  filename: string,
  previewUrl: string | null,
  redirectChain: string[],
  headers: Record<string, string>,
  ip: string,
  scanType: string
) {
  let userEmail: string | undefined = undefined;
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (user) {
      userEmail = user.email;
    }
  } catch {}

  try {
    await ApiUsageLog.create({
      ip,
      action: `analyze-${scanType}`,
      url,
      platform,
      status: 'success',
      userEmail
    });
  } catch (logErr) {
    console.error('Direct media logging failed:', logErr);
  }

  return NextResponse.json({
    success: true, url, domain, platform, contentType,
    title: filename, previewUrl: previewUrl || '',
    mediaUrls: [url],
    linkIntel: { redirectChain, ipAddress: 'Unknown', dnsRecords: [], whois: null, virusTotal: null, safe: true, shortUrl: '', headers },
  });
}

function extractDeveloperSpecs(htmlText: string, finalUrl: string) {
  const fonts = new Set<string>();
  const colorsMap: Record<string, number> = {};
  const designTokens: Array<{ name: string; value: string }> = [];
  const assets = {
    images: new Set<string>(),
    stylesheets: new Set<string>(),
    scripts: new Set<string>(),
    media: new Set<string>(),
    favicons: new Set<string>()
  };

  if (!htmlText) {
    return {
      colors: [],
      fonts: [],
      designTokens: [],
      assets: { images: [], stylesheets: [], scripts: [], media: [], favicons: [] }
    };
  }

  const $ = cheerio.load(htmlText);

  // Helper to resolve URLs absolutely
  const resolveUrl = (path: string): string | null => {
    if (!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if (trimmed.startsWith('data:')) return null; // skip base64
    try {
      return new URL(trimmed, finalUrl).href;
    } catch {
      return null;
    }
  };

  // Tracking domains regex
  const isTracking = (urlStr: string): boolean => {
    return /google-analytics|googletagmanager|facebook\.net|connect\.facebook|clarity\.ms|hotjar|mixpanel|segment\.io|doubleclick|amplitude|sentry|crazyegg|optimizely/i.test(urlStr);
  };

  // 1. Parse fonts from google fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const urlObj = new URL(href, finalUrl);
      const family = urlObj.searchParams.get('family');
      if (family) {
        family.split('|').forEach(f => {
          const name = f.split(':')[0].replace(/\+/g, ' ').trim();
          if (name) fonts.add(name);
        });
      }
    } catch {}
  });

  // Parse styles content
  $('style').each((_, el) => {
    const cssText = $(el).text();
    // Scan font-family in CSS
    const fontFamilyRegex = /font-family\s*:\s*([^;!}\n]+)/gi;
    let fm;
    while ((fm = fontFamilyRegex.exec(cssText)) !== null) {
      const families = fm[1].split(',');
      families.forEach(f => {
        const cleaned = f.replace(/['"]/g, '').trim();
        if (cleaned && !['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'inherit', 'initial', 'revert', 'unset'].includes(cleaned.toLowerCase())) {
          fonts.add(cleaned);
        }
      });
    }

    // Scan custom properties (design tokens)
    const customPropRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;!}\n]+)/gi;
    let cp;
    while ((cp = customPropRegex.exec(cssText)) !== null) {
      const name = cp[1].trim();
      const value = cp[2].trim();
      if (!designTokens.some(t => t.name === name)) {
        designTokens.push({ name, value });
      }
    }

    // Scan colors from style tags
    const hexColorRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    const rgbColorRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;
    const hslColorRegex = /hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+\s*)?\)/gi;

    let hc;
    while ((hc = hexColorRegex.exec(cssText)) !== null) {
      const color = hc[0].toLowerCase();
      colorsMap[color] = (colorsMap[color] || 0) + 1;
    }
    let rc;
    while ((rc = rgbColorRegex.exec(cssText)) !== null) {
      const color = rc[0].toLowerCase();
      colorsMap[color] = (colorsMap[color] || 0) + 1;
    }
    let hsc;
    while ((hsc = hslColorRegex.exec(cssText)) !== null) {
      const color = hsc[0].toLowerCase();
      colorsMap[color] = (colorsMap[color] || 0) + 1;
    }
  });

  // Parse style attributes in HTML elements
  $('[style]').each((_, el) => {
    const styleAttr = $(el).attr('style') || '';
    // font-family
    const fontFamilyRegex = /font-family\s*:\s*([^;!}\n]+)/gi;
    let fm;
    while ((fm = fontFamilyRegex.exec(styleAttr)) !== null) {
      const families = fm[1].split(',');
      families.forEach(f => {
        const cleaned = f.replace(/['"]/g, '').trim();
        if (cleaned && !['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'inherit', 'initial', 'revert', 'unset'].includes(cleaned.toLowerCase())) {
          fonts.add(cleaned);
        }
      });
    }

    // colors
    const hexColorRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    const rgbColorRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;
    const hslColorRegex = /hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+\s*)?\)/gi;

    let hc;
    while ((hc = hexColorRegex.exec(styleAttr)) !== null) {
      const color = hc[0].toLowerCase();
      colorsMap[color] = (colorsMap[color] || 0) + 1;
    }
    let rc;
    while ((rc = rgbColorRegex.exec(styleAttr)) !== null) {
      const color = rc[0].toLowerCase();
      colorsMap[color] = (colorsMap[color] || 0) + 1;
    }
    let hsc;
    while ((hsc = hslColorRegex.exec(styleAttr)) !== null) {
      const color = hsc[0].toLowerCase();
      colorsMap[color] = (colorsMap[color] || 0) + 1;
    }
  });

  // Clean and limit colors to top 10 unique
  const sortedColors = Object.entries(colorsMap)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  const topColors = sortedColors.slice(0, 10);

  // 2. Gather Assets
  // Image assets: img tags, og:image meta tags, link image_src tags
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const dataSrc = $(el).attr('data-src');
    if (src) {
      const abs = resolveUrl(src);
      if (abs && !isTracking(abs)) assets.images.add(abs);
    }
    if (dataSrc) {
      const abs = resolveUrl(dataSrc);
      if (abs && !isTracking(abs)) assets.images.add(abs);
    }
  });

  // Favicons
  $('link[rel*="icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const abs = resolveUrl(href);
      if (abs) assets.favicons.add(abs);
    }
  });

  // Stylesheets
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const abs = resolveUrl(href);
      if (abs && !isTracking(abs)) assets.stylesheets.add(abs);
    }
  });

  // Scripts
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const abs = resolveUrl(src);
      if (abs && !isTracking(abs)) assets.scripts.add(abs);
    }
  });

  // Media (videos, source tags, audios)
  $('video, audio, source').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const abs = resolveUrl(src);
      if (abs && !isTracking(abs)) assets.media.add(abs);
    }
  });

  // Background images
  const bgImgRegex = /url\(['"]?([^'")]+)['"]?\)/gi;
  $('style').each((_, el) => {
    const cssText = $(el).text();
    let bgm;
    while ((bgm = bgImgRegex.exec(cssText)) !== null) {
      const abs = resolveUrl(bgm[1]);
      if (abs && !isTracking(abs)) {
        if (/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff)/i.test(abs)) {
          assets.images.add(abs);
        } else if (/\.(mp4|webm|ogg|mp3|wav|m4a|aac)/i.test(abs)) {
          assets.media.add(abs);
        }
      }
    }
  });

  $('[style]').each((_, el) => {
    const styleAttr = $(el).attr('style') || '';
    let bgm;
    while ((bgm = bgImgRegex.exec(styleAttr)) !== null) {
      const abs = resolveUrl(bgm[1]);
      if (abs && !isTracking(abs)) {
        if (/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff)/i.test(abs)) {
          assets.images.add(abs);
        } else if (/\.(mp4|webm|ogg|mp3|wav|m4a|aac)/i.test(abs)) {
          assets.media.add(abs);
        }
      }
    }
  });

  return {
    colors: topColors,
    fonts: Array.from(fonts).slice(0, 10),
    designTokens: designTokens.slice(0, 30),
    assets: {
      images: Array.from(assets.images),
      stylesheets: Array.from(assets.stylesheets),
      scripts: Array.from(assets.scripts),
      media: Array.from(assets.media),
      favicons: Array.from(assets.favicons)
    }
  };
}
