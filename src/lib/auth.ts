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

export async function checkFeaturePermission(featureName: string): Promise<{
  authorized: boolean;
  requiredLevel: 'free' | 'registered' | 'pro';
  user: { email: string; role: 'standard' | 'pro' | 'admin' } | null;
}> {
  const defaultTiers: Record<string, 'free' | 'registered' | 'pro'> = {
    'analyze-intel': 'registered',
    'analyze-lighthouse': 'free',
    'analyze-ai-research': 'registered',
    'analyze-ai-writer': 'pro',
    'download-media': 'free',
    'transcribe': 'registered',
    'remove-bg': 'pro',
    'screenshot': 'registered'
  };

  const defaultLevel = defaultTiers[featureName] || 'registered';
  let requiredLevel = defaultLevel;
  let user: { email: string; role: 'standard' | 'pro' | 'admin' } | null = null;

  try {
    const { connectToDatabase } = await import('@/lib/db');
    const ApiConfig = (await import('@/models/ApiConfig')).default;

    try {
      await connectToDatabase();
      const config = await ApiConfig.findOne({ featureName });
      if (config) {
        requiredLevel = config.requiredLevel;
      }
    } catch (dbErr: any) {
      console.warn(`checkFeaturePermission DB connection failed for ${featureName}, using default level:`, dbErr.message);
    }

    if (requiredLevel === 'free') {
      user = await getCurrentUser();
      return { authorized: true, requiredLevel, user };
    }

    user = await getCurrentUser();
    if (!user) {
      return { authorized: false, requiredLevel, user: null };
    }

    if (requiredLevel === 'registered') {
      return { authorized: true, requiredLevel, user };
    }

    if (requiredLevel === 'pro') {
      if (user.role === 'pro' || user.role === 'admin') {
        return { authorized: true, requiredLevel, user };
      }
      return { authorized: false, requiredLevel, user };
    }

    return { authorized: false, requiredLevel, user };
  } catch (err) {
    console.error('checkFeaturePermission error:', err);
    return { authorized: requiredLevel === 'free', requiredLevel, user: null };
  }
}


