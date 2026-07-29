import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'user_auth_secure_secret_123!';

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === testHash;
}

export function createToken(email: string, role: string): string {
  const payload = JSON.stringify({ email, role, expiresAt: Date.now() + 1000 * 60 * 60 * 24 });
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${signature}`;
}

export function verifyToken(token: string): { email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadStr = Buffer.from(parts[0], 'base64').toString('utf8');
    const signature = parts[1];
    
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadStr).digest('hex');
    if (signature !== expectedSig) return null;
    
    const data = JSON.parse(payloadStr);
    if (Date.now() > data.expiresAt) return null;
    return { email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { cookies } = await import('next/headers');
    const { connectToDatabase } = await import('@/lib/db');
    const User = (await import('@/models/User')).default;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        try {
          await connectToDatabase();
          const user = await User.findOne({ email: decoded.email.toLowerCase() });
          if (user) {
            return {
              email: user.email,
              role: user.role as 'standard' | 'pro' | 'admin'
            };
          }
        } catch (dbErr: any) {
          console.warn('getCurrentUser DB connection failed, using verified token data:', dbErr.message);
          return {
            email: decoded.email,
            role: (decoded.role || 'standard') as 'standard' | 'pro' | 'admin'
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
  }
}

export async function checkFeaturePermission(featureName: string, userIp?: string): Promise<{
  authorized: boolean;
  requiredLevel: 'free' | 'registered' | 'pro';
  user: { email: string; role: 'standard' | 'pro' | 'admin' } | null;
  limitReached: boolean;
  currentCount: number;
  maxLimit: number;
}> {
  const defaultConfigs: Record<string, { requiredLevel: 'free' | 'registered' | 'pro'; freeLimit: number; registeredLimit: number; proLimit: number }> = {
    'analyze-base': { requiredLevel: 'free', freeLimit: 10, registeredLimit: 50, proLimit: -1 },
    'analyze-intel': { requiredLevel: 'registered', freeLimit: 0, registeredLimit: 30, proLimit: -1 },
    'analyze-lighthouse': { requiredLevel: 'free', freeLimit: 10, registeredLimit: 40, proLimit: -1 },
    'analyze-ai-research': { requiredLevel: 'registered', freeLimit: 0, registeredLimit: 10, proLimit: -1 },
    'analyze-ai-writer': { requiredLevel: 'pro', freeLimit: 0, registeredLimit: 0, proLimit: 50 },
    'download-media': { requiredLevel: 'free', freeLimit: 5, registeredLimit: 25, proLimit: -1 },
    'transcribe': { requiredLevel: 'registered', freeLimit: 0, registeredLimit: 5, proLimit: 50 },
    'remove-bg': { requiredLevel: 'pro', freeLimit: 0, registeredLimit: 0, proLimit: 20 },
    'screenshot': { requiredLevel: 'registered', freeLimit: 0, registeredLimit: 15, proLimit: -1 }
  };

  const def = defaultConfigs[featureName] || { requiredLevel: 'registered' as const, freeLimit: 0, registeredLimit: 10, proLimit: -1 };
  let requiredLevel = def.requiredLevel;
  let freeLimit = def.freeLimit;
  let registeredLimit = def.registeredLimit;
  let proLimit = def.proLimit;

  let user: { email: string; role: 'standard' | 'pro' | 'admin' } | null = null;
  let limitReached = false;
  let currentCount = 0;
  let maxLimit = 0;

  try {
    const { connectToDatabase } = await import('@/lib/db');
    const ApiConfig = (await import('@/models/ApiConfig')).default;
    const ApiUsageLog = (await import('@/models/ApiUsageLog')).default;

    try {
      await connectToDatabase();
      const config = await ApiConfig.findOne({ featureName });
      if (config) {
        requiredLevel = config.requiredLevel;
        if (config.freeLimit !== undefined) freeLimit = config.freeLimit;
        if (config.registeredLimit !== undefined) registeredLimit = config.registeredLimit;
        if (config.proLimit !== undefined) proLimit = config.proLimit;
      }
    } catch (dbErr: any) {
      console.warn(`checkFeaturePermission DB connection failed for ${featureName}, using default level:`, dbErr.message);
    }

    user = await getCurrentUser();

    // Determine maxLimit based on user's tier
    if (user) {
      if (user.role === 'admin') {
        maxLimit = -1; // Unlimited for admin
      } else if (user.role === 'pro') {
        maxLimit = proLimit;
      } else {
        maxLimit = registeredLimit;
      }
    } else {
      maxLimit = freeLimit;
    }

    // Step 1: Check standard role tier authorizations
    let tierAuthorized = false;
    if (requiredLevel === 'free') {
      tierAuthorized = true;
    } else if (requiredLevel === 'registered') {
      tierAuthorized = user !== null;
    } else if (requiredLevel === 'pro') {
      tierAuthorized = user !== null && (user.role === 'pro' || user.role === 'admin');
    }

    if (!tierAuthorized) {
      return { authorized: false, requiredLevel, user, limitReached: false, currentCount: 0, maxLimit };
    }

    // Step 2: Check rate limits
    if (maxLimit !== -1) {
      const startOf24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      try {
        const query: any = {
          action: featureName,
          status: 'success', // Only count successful executions
          timestamp: { $gte: startOf24h }
        };

        if (user) {
          query.userEmail = user.email;
        } else if (userIp) {
          query.ip = userIp;
        } else {
          // If no IP or user is present, don't query count
          query.ip = 'unknown-ip-skip';
        }

        currentCount = await ApiUsageLog.countDocuments(query);
        if (currentCount >= maxLimit) {
          limitReached = true;
          return { authorized: false, requiredLevel, user, limitReached, currentCount, maxLimit };
        }
      } catch (countErr) {
        console.error('Failed to count document usage for limit:', countErr);
      }
    }

    return { authorized: true, requiredLevel, user, limitReached, currentCount, maxLimit };
  } catch (err) {
    console.error('checkFeaturePermission error:', err);
    return { authorized: requiredLevel === 'free', requiredLevel, user: null, limitReached: false, currentCount: 0, maxLimit };
  }
}


