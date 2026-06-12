import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import ApiUsageLog from '@/models/ApiUsageLog';
import Feedback from '@/models/Feedback';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  
  const adminEmail = process.env.ADMIN_EMAIL || 'shashank8808108802@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const expectedToken = crypto.createHmac('sha256', adminPassword).update(adminEmail).digest('hex');
  return token === expectedToken;
}

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdmin();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const actionFilter = searchParams.get('action') || '';

    const skip = (page - 1) * limit;

    // Filter
    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } }
      ];
    }
    if (actionFilter) {
      query.action = actionFilter;
    }

    // 1. Fetch metrics
    const totalScans = await ApiUsageLog.countDocuments();
    const uniqueUsers = (await ApiUsageLog.distinct('ip')).length;
    
    const startOfToday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayScans = await ApiUsageLog.countDocuments({ timestamp: { $gte: startOfToday } });

    // 2. API keys configuration checks
    const apiKeysStatus = {
      Gemini: !!process.env.GEMINI_API_KEY,
      VirusTotal: !!process.env.VIRUSTOTAL_API_KEY,
      IPInfo: !!process.env.IPINFO_TOKEN,
      WhoisXML: !!process.env.WHOISXML_API_KEY,
      AssemblyAI: !!process.env.ASSEMBLYAI_API_KEY,
      RemoveBg: !!process.env.REMOVE_BG_API_KEY
    };

    // 3. API key usage counters in the last 24h
    const geminiUsage = await ApiUsageLog.countDocuments({
      timestamp: { $gte: startOfToday },
      status: 'success',
      apiUsed: { $regex: /Gemini/i }
    });
    const virusTotalUsage = await ApiUsageLog.countDocuments({
      timestamp: { $gte: startOfToday },
      status: 'success',
      apiUsed: { $regex: /VirusTotal/i }
    });
    const ipInfoUsage = await ApiUsageLog.countDocuments({
      timestamp: { $gte: startOfToday },
      status: 'success',
      apiUsed: { $regex: /IPInfo/i }
    });
    const whoisXmlUsage = await ApiUsageLog.countDocuments({
      timestamp: { $gte: startOfToday },
      status: 'success',
      apiUsed: { $regex: /WhoisXML/i }
    });
    const assemblyAiUsage = await ApiUsageLog.countDocuments({
      timestamp: { $gte: startOfToday },
      status: 'success',
      apiUsed: { $regex: /AssemblyAI/i }
    });
    const removeBgUsage = await ApiUsageLog.countDocuments({
      timestamp: { $gte: startOfToday },
      status: 'success',
      apiUsed: { $regex: /Remove\.bg/i }
    });

    const apiUsageStats = {
      Gemini: { usage: geminiUsage, limit: 1500, label: 'Calls/Day' },
      VirusTotal: { usage: virusTotalUsage, limit: 500, label: 'Calls/Day' },
      IPInfo: { usage: ipInfoUsage, limit: 1600, label: 'Calls/Day' },
      WhoisXML: { usage: whoisXmlUsage, limit: 16, label: 'Calls/Day' },
      AssemblyAI: { usage: assemblyAiUsage, limit: 100, label: 'Calls/Day' },
      RemoveBg: { usage: removeBgUsage, limit: 2, label: 'Calls/Day' }
    };

    // 4. Fetch logs details (paginated)
    const logs = await ApiUsageLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalLogs = await ApiUsageLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit);

    // Fetch feedbacks (limit to 50 for admin view)
    const feedbacks = await Feedback.find({})
      .sort({ timestamp: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      metrics: {
        totalScans,
        uniqueUsers,
        todayScans,
        configuredKeysCount: Object.values(apiKeysStatus).filter(Boolean).length,
        totalKeysCount: Object.keys(apiKeysStatus).length
      },
      apiKeysStatus,
      apiUsageStats,
      logs,
      feedbacks,
      pagination: {
        page,
        limit,
        totalPages,
        totalLogs
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
