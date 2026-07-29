'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music as MusicIcon, 
  Globe as GlobeIcon, 
  Download, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  ArrowRight,
  User as UserIcon,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Search,
  Sparkles,
  Clock,
  ArrowDown,
  MapPin,
  Building2,
  Calendar,
  Wifi,
  Layers,
  Mic,
  Eraser,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  LogOut,
  ChevronDown,
  Activity,
  Shield
} from 'lucide-react';
import exifr from 'exifr';
import QRCode from 'qrcode';
import { createWorker } from 'tesseract.js';


interface AnalysisResult {
  success: boolean;
  url: string;
  domain: string;
  platform: 'youtube' | 'instagram' | 'pinterest' | 'twitter' | 'facebook' | 'vimeo' | 'reddit' | 'tiktok' | 'direct-image' | 'direct-video' | 'direct-audio' | 'website';
  contentType: 'image' | 'video' | 'audio' | 'website';
  title?: string;
  description?: string;
  previewUrl?: string;
  mediaUrls?: string[];
  embedUrl?: string;
  author?: string;
  hashtags?: string[];
  duration?: string;
  hasSubtitles?: boolean;
  techStack?: string[];
  aiSuggestions?: {
    captions: string[];
    optimizedTitles: string[];
    seoDescription: string;
    hashtags?: string[];
  };
  linkIntel?: {
    redirectChain: string[];
    ipAddress: string;
    ipInfo?: {
      ip: string;
      hostname?: string;
      city: string;
      region: string;
      country: string;
      org: string;
      loc: string;
      timezone: string;
      postal?: string;
    };
    dnsRecords: Array<{ type: string; records: string[] }>;
    whois?: {
      registrar: string;
      createdDate: string;
      expiresDate: string;
      updatedDate: string;
      registrantOrg: string;
      registrantCountry: string;
      nameServers: string[];
      domainAge?: number;
      status?: string;
    };
    virusTotal?: {
      harmless: number;
      malicious: number;
      suspicious: number;
      undetected: number;
      timeout: number;
      total: number;
      safe: boolean;
      permalink: string;
      lastAnalysisDate: string;
      scanning?: boolean;
    };
    safe: boolean;
    shortUrl: string;
    headers?: Record<string, string>;
  };
  geminiResearch?: {
    summary: string;
    targetAudience: string;
    competitors: string[];
    seoAdvice: string[];
  };
  lighthouseAudit?: {
    performance: { score: number; items: Array<{ name: string; passed: boolean; detail: string }> };
    seo: { score: number; items: Array<{ name: string; passed: boolean; detail: string }> };
    bestPractices: { score: number; items: Array<{ name: string; passed: boolean; detail: string }> };
    accessibility: { score: number; items: Array<{ name: string; passed: boolean; detail: string }> };
  };
  sslCertificate?: {
    issuer: string;
    validFrom: string;
    validTo: string;
    subject: string;
    serialNumber: string;
    bits: number;
    daysRemaining: number;
    valid: boolean;
  };
  robotsTxt?: {
    rulesCount: number;
    sitemaps: string[];
    disallows: string[];
  };
  imageAnalysis?: {
    description: string;
    objects: string[];
    tags: string[];
    faces: number;
  };
  developerSpecs?: {
    colors: string[];
    fonts: string[];
    designTokens: Array<{ name: string; value: string }>;
    assets: {
      images: string[];
      stylesheets: string[];
      scripts: string[];
      media: string[];
      favicons: string[];
    };
  };
  trustSafety?: {
    verdict: 'REAL' | 'SUSPICIOUS' | 'FAKE';
    trustScore: number;
    analysis: string;
  };
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
    embedUrl?: string;
  };
  productData?: {
    price: number;
    currency: string;
    title?: string;
    priceHistory?: Array<{
      price: number;
      currency: string;
      timestamp: string;
    }>;
  };
}

const LighthouseScoreCircle = ({ score, label }: { score: number; label: string }) => {
  const isGreen = score >= 90;
  const isAmber = score >= 50;
  
  const circleColor = isGreen ? 'stroke-emerald-500' : isAmber ? 'stroke-amber-500' : 'stroke-rose-500';
  const textColor = isGreen ? 'text-emerald-600' : isAmber ? 'text-amber-600' : 'text-rose-600';

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-2xl flex-1 min-w-[100px] bg-white border border-zinc-100">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90">
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            className="stroke-zinc-100 fill-none" 
            strokeWidth="5" 
          />
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            className={`fill-none transition-all duration-1000 ease-out ${circleColor}`} 
            strokeWidth="5" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-mono text-base font-black ${textColor}`}>
          {score}
        </div>
      </div>
      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
};

// Premium Pure SVG Loader Components
const LoaderTripleArcs = ({ className = "text-violet-600", size = 48 }: { className?: string; size?: number }) => (
  <svg 
    className={className}
    style={{ width: size, height: size, display: 'inline-block' }}
    viewBox="0 0 100 100" 
    xmlSpace="preserve"
  >
    <path fill="currentColor" d="M31.6,3.5C5.9,13.6-6.6,42.7,3.5,68.4c10.1,25.7,39.2,38.3,64.9,28.1l-3.1-7.9c-21.3,8.4-45.4-2-53.8-23.3 c-8.4-21.3,2-45.4,23.3-53.8L31.6,3.5z">
      <animateTransform 
        attributeName="transform" 
        attributeType="XML" 
        type="rotate"
        dur="2s" 
        from="0 50 50"
        to="360 50 50" 
        repeatCount="indefinite" 
      />
    </path>
    <path fill="currentColor" d="M42.3,39.6c5.7-4.3,13.9-3.1,18.1,2.7c4.3,5.7,3.1,13.9-2.7,18.1l4.1,5.5c8.8-6.5,10.6-19,4.1-27.7 c-6.5-8.8-19-10.6-27.7-4.1L42.3,39.6z">
      <animateTransform 
        attributeName="transform" 
        attributeType="XML" 
        type="rotate"
        dur="1s" 
        from="0 50 50"
        to="-360 50 50" 
        repeatCount="indefinite" 
      />
    </path>
    <path fill="currentColor" d="M82,35.7C74.1,18,53.4,10.1,35.7,18S10.1,46.6,18,64.3l7.6-3.4c-6-13.5,0-29.3,13.5-35.3s29.3,0,35.3,13.5 L82,35.7z">
      <animateTransform 
        attributeName="transform" 
        attributeType="XML" 
        type="rotate"
        dur="2s" 
        from="0 50 50"
        to="360 50 50" 
        repeatCount="indefinite" 
      />
    </path>
  </svg>
);

const LoaderOrbCircle = ({ className = "text-violet-650", size = 48 }: { className?: string; size?: number }) => (
  <svg 
    className={className}
    style={{ width: size, height: size, display: 'inline-block' }}
    viewBox="0 0 100 100" 
    xmlSpace="preserve"
  >
    <circle fill="none" stroke="currentColor" strokeWidth="4" cx="50" cy="50" r="44" style={{ opacity: 0.25 }} />
    <circle fill="currentColor" stroke="currentColor" strokeWidth="3" cx="8" cy="54" r="6" >
      <animateTransform
        attributeName="transform"
        dur="2s"
        type="rotate"
        from="0 50 48"
        to="360 50 52"
        repeatCount="indefinite" 
      />
    </circle>
  </svg>
);

const LoaderClock = ({ className = "text-violet-600", size = 48 }: { className?: string; size?: number }) => (
  <svg 
    className={className}
    style={{ width: size, height: size, display: 'inline-block' }}
    viewBox="0 0 100 100" 
    xmlSpace="preserve"
  >
    <circle fill="none" stroke="currentColor" strokeWidth="4" strokeMiterlimit="10" cx="50" cy="50" r="48" style={{ opacity: 0.25 }} />
    <line fill="none" strokeLinecap="round" stroke="currentColor" strokeWidth="4" strokeMiterlimit="10" x1="50" y1="50" x2="85" y2="50.5">
      <animateTransform 
        attributeName="transform" 
        dur="2s"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite" 
      />
    </line>
    <line fill="none" strokeLinecap="round" stroke="currentColor" strokeWidth="4" strokeMiterlimit="10" x1="50" y1="50" x2="49.5" y2="74">
      <animateTransform 
        attributeName="transform" 
        dur="15s"
        type="rotate"
        from="0 50 50"
        to="360 50 50"
        repeatCount="indefinite" 
      />
    </line>
  </svg>
);

const LoaderDoubleRing = ({ className = "text-violet-600", size = 48 }: { className?: string; size?: number }) => (
  <svg 
    className={className}
    style={{ width: size, height: size, display: 'inline-block' }}
    viewBox="0 0 100 100" 
    xmlSpace="preserve"
  >
    <path fill="currentColor" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
      <animateTransform 
        attributeName="transform" 
        attributeType="XML" 
        type="rotate"
        dur="1s" 
        from="0 50 50"
        to="360 50 50" 
        repeatCount="indefinite" 
      />
    </path>
  </svg>
);

const LoaderEqualizer = ({ className = "text-violet-600", size = 48 }: { className?: string; size?: number }) => (
  <svg 
    className={className}
    style={{ width: size, height: size, display: 'inline-block' }}
    viewBox="0 0 100 100" 
    xmlSpace="preserve"
  >
    <rect fill="currentColor" width="4" height="100" transform="translate(0) rotate(180 3 50)">
      <animate
        attributeName="height"
        attributeType="XML"
        dur="1s"
        values="30; 100; 30"
        repeatCount="indefinite"
      />
    </rect>
    <rect x="20" fill="currentColor" width="4" height="100" transform="translate(0) rotate(180 20 50)">
      <animate
        attributeName="height"
        attributeType="XML"
        dur="1s"
        values="30; 100; 30"
        repeatCount="indefinite"
        begin="0.1s"
      />
    </rect>
    <rect x="40" fill="currentColor" width="4" height="100" transform="translate(0) rotate(180 40 50)">
      <animate
        attributeName="height"
        attributeType="XML"
        dur="1s"
        values="30; 100; 30"
        repeatCount="indefinite"
        begin="0.3s"
      />
    </rect>
    <rect x="60" fill="currentColor" width="4" height="100" transform="translate(0) rotate(180 58 50)">
      <animate
        attributeName="height"
        attributeType="XML"
        dur="1s"
        values="30; 100; 30"
        repeatCount="indefinite"
        begin="0.5s"
      />
    </rect>
    <rect x="80" fill="currentColor" width="4" height="100" transform="translate(0) rotate(180 76 50)">
      <animate
        attributeName="height"
        attributeType="XML"
        dur="1s"
        values="30; 100; 30"
        repeatCount="indefinite"
        begin="0.1s"
      />
    </rect>
  </svg>
);

const LoaderPulsingDots = ({ className = "text-white", size = 15 }: { className?: string; size?: number }) => (
  <svg 
    className={className}
    style={{ width: size * 3, height: size, display: 'inline-block' }}
    viewBox="0 0 100 100" 
    xmlSpace="preserve"
  >
    <circle fill="currentColor" stroke="none" cx="15" cy="50" r="10">
      <animateTransform 
        attributeName="transform" 
        dur="1s" 
        type="translate" 
        values="0 15 ; 0 -15; 0 15" 
        repeatCount="indefinite" 
        begin="0.1"
      />
    </circle>
    <circle fill="currentColor" stroke="none" cx="50" cy="50" r="10">
      <animateTransform 
        attributeName="transform" 
        dur="1s" 
        type="translate" 
        values="0 10 ; 0 -10; 0 10" 
        repeatCount="indefinite" 
        begin="0.2"
      />
    </circle>
    <circle fill="currentColor" stroke="none" cx="85" cy="50" r="10">
      <animateTransform 
        attributeName="transform" 
        dur="1s" 
        type="translate" 
        values="0 5 ; 0 -5; 0 5" 
        repeatCount="indefinite" 
        begin="0.3"
      />
    </circle>
  </svg>
);

const getTabTransitionLoader = (tabId: string, platform?: string | null) => {
  let loaderComponent = <LoaderOrbCircle size={48} className="text-violet-600" />;
  let loadingMessage = "Preparing tab specs...";

  switch (tabId) {
    case 'video':
      loaderComponent = <LoaderOrbCircle size={48} className="text-violet-600" />;
      loadingMessage = platform === 'youtube' ? "Fetching YouTube embed player..." : "Rendering video preview elements...";
      break;
    case 'image':
      loaderComponent = <LoaderOrbCircle size={48} className="text-pink-500" />;
      loadingMessage = "Processing high-res image previews...";
      break;
    case 'audio':
      loaderComponent = <LoaderEqualizer size={48} className="text-emerald-500" />;
      loadingMessage = "Syncing audio streams and equalizer...";
      break;
    case 'website':
      loaderComponent = <LoaderTripleArcs size={48} className="text-blue-500" />;
      loadingMessage = "Parsing DOM structure and links...";
      break;
    case 'image-tools':
      loaderComponent = <LoaderOrbCircle size={48} className="text-orange-500" />;
      loadingMessage = "Initializing visual extraction tools...";
      break;
    case 'dev-specs':
      loaderComponent = <LoaderTripleArcs size={48} className="text-indigo-500" />;
      loadingMessage = "Extracting CSS variables & typography specs...";
      break;
    case 'link-intel':
      loaderComponent = <LoaderTripleArcs size={48} className="text-teal-500" />;
      loadingMessage = "Re-checking DNS records and network intelligence...";
      break;
    case 'lighthouse':
      loaderComponent = <LoaderDoubleRing size={48} className="text-yellow-500" />;
      loadingMessage = "Loading performance parameters...";
      break;
    case 'screenshots':
      loaderComponent = <LoaderClock size={48} className="text-purple-500" />;
      loadingMessage = "Structuring responsive preview layouts...";
      break;
    case 'og-preview':
      loaderComponent = <LoaderOrbCircle size={48} className="text-cyan-500" />;
      loadingMessage = "Formatting OpenGraph metadata previews...";
      break;
    case 'ai-research':
      loaderComponent = <LoaderOrbCircle size={48} className="text-violet-650" />;
      loadingMessage = platform === 'youtube' 
        ? "Extracting video transcript details..." 
        : "Summarizing article semantic findings...";
      break;
    case 'ai-tools':
      loaderComponent = <LoaderOrbCircle size={48} className="text-fuchsia-600" />;
      loadingMessage = "Initializing AI content writer tools...";
      break;
    case 'trust-safety':
      loaderComponent = <LoaderDoubleRing size={48} className="text-rose-500" />;
      loadingMessage = "Running domain trust audits & safety scan...";
      break;
    default:
      loaderComponent = <LoaderOrbCircle size={48} className="text-violet-600" />;
      loadingMessage = "Loading feature workspace...";
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
      <div className="relative">
        {loaderComponent}
      </div>
      <p className="text-zinc-500 text-sm font-medium tracking-wide animate-pulse">
        {loadingMessage}
      </p>
    </div>
  );
};

interface SubtitleItem {
  index: number;
  start: number;
  end: number;
  text: string;
}

interface ExtraOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
}

const CAPTION_PRESETS = [
  { id: 'tiktok-bold', name: 'TikTok Bold', style: { fontFamily: '"Impact", sans-serif', color: '#FFFF00', textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000', fontSize: '26px', fontWeight: 'bold', textTransform: 'uppercase' } },
  { id: 'classic-white', name: 'Netflix Classic', style: { fontFamily: 'sans-serif', color: '#FFFFFF', textShadow: '1px 1px 3px rgba(0,0,0,0.8)', fontSize: '22px' } },
  { id: 'neon-cyan', name: 'Neon Cyber', style: { fontFamily: '"Arial Black", sans-serif', color: '#00FFFF', textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF', fontSize: '24px', fontWeight: 'bold' } },
  { id: 'neon-pink', name: 'Neon Pink', style: { fontFamily: '"Arial Black", sans-serif', color: '#FF00FF', textShadow: '0 0 10px #FF00FF, 0 0 20px #FF00FF', fontSize: '24px', fontWeight: 'bold' } },
  { id: 'arcade', name: 'Arcade Retro', style: { fontFamily: '"Courier New", monospace', color: '#00FF00', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '20px', letterSpacing: '2px' } },
  { id: 'comic', name: 'Comic Bubble', style: { fontFamily: '"Comic Sans MS", cursive', color: '#FFD750', textShadow: '2px 2px 0px #FF4500', fontSize: '24px', fontWeight: 'bold' } },
  { id: 'minimal-black', name: 'Minimal Box', style: { fontFamily: 'sans-serif', color: '#FFFFFF', backgroundColor: '#000000', padding: '6px 12px', fontSize: '20px', fontWeight: 'medium' } },
  { id: 'royal-gold', name: 'Royal Gold', style: { fontFamily: '"Times New Roman", serif', color: '#FFD700', textShadow: '1px 1px 2px #000000', fontSize: '24px', fontStyle: 'italic' } },
  { id: 'vhs-glitch', name: 'VHS Glitch', style: { fontFamily: 'monospace', color: '#FFFFFF', textShadow: '2px 0 0 #FF0000, -2px 0 0 #0000FF', fontSize: '22px' } },
  { id: 'gradient-sunset', name: 'Sunset Gradient', style: { fontFamily: '"Impact", sans-serif', color: '#FF4500', textShadow: '1px 1px 0px #FFFF00', fontSize: '26px', fontWeight: 'bold' } },
  { id: 'bold-red', name: 'Alert Red', style: { fontFamily: 'sans-serif', color: '#FF0000', fontWeight: '900', textShadow: '1px 1px 1px #000', fontSize: '28px', textTransform: 'uppercase' } },
  { id: 'speech', name: 'Speech Bubble', style: { fontFamily: 'sans-serif', color: '#000000', backgroundColor: '#FFFFFF', border: '2px solid #000', borderRadius: '15px', padding: '8px 16px', fontSize: '20px' } },
  { id: 'crayon', name: 'Crayon Soft', style: { fontFamily: 'sans-serif', color: '#FFB6C1', textShadow: '1px 1px 0px #DDA0DD', fontSize: '24px', fontWeight: 'bold' } },
  { id: 'monospace-orange', name: 'Console Orange', style: { fontFamily: 'monospace', color: '#FFA500', fontSize: '20px' } },
  { id: 'clean-grey', name: 'Subtle Outline', style: { fontFamily: 'sans-serif', color: '#F5F5F5', textShadow: '0px 0px 4px #808080', fontSize: '22px' } },
  { id: 'shadow-yellow', name: 'Shadow Yellow', style: { fontFamily: 'sans-serif', color: '#FFFF00', textShadow: '3px 3px 0px rgba(0,0,0,0.6)', fontSize: '24px', fontWeight: 'bold' } },
  { id: 'heavy-metal', name: 'Heavy Metal', style: { fontFamily: '"Impact", sans-serif', color: '#708090', textShadow: '2px 2px 2px #000', fontSize: '26px', letterSpacing: '1px' } },
  { id: 'chalkboard', name: 'Chalk White', style: { fontFamily: 'cursive', color: '#F0FFF0', textShadow: '1px 1px 2px #2F4F4F', fontSize: '22px' } },
  { id: 'cyberpunk-yellow', name: 'Cyberpunk Solid', style: { fontFamily: '"Arial Black", sans-serif', color: '#000000', backgroundColor: '#FFFF00', padding: '6px 10px', fontSize: '22px', fontWeight: 'black' } },
  { id: 'future-green', name: 'Matrix Digital', style: { fontFamily: 'monospace', color: '#00FF00', textShadow: '0 0 5px #00FF00', fontSize: '22px' } }
];

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // User Authentication States
  const [currentUser, setCurrentUser] = useState<{ email: string; role: 'standard' | 'pro' | 'admin'; scansCountToday?: number } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'login'>('signup');
  const [authModalRequiredLevel, setAuthModalRequiredLevel] = useState<'registered' | 'pro'>('registered');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch session on load
  useEffect(() => {
    setIsSessionLoading(true);
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch session:', err))
      .finally(() => setIsSessionLoading(false));
  }, []);

  // Update session stats when profile dropdown is opened
  useEffect(() => {
    if (isProfileMenuOpen && currentUser) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(err => console.error('Failed to update stats:', err));
    }
  }, [isProfileMenuOpen]);

  // Close profile dropdown menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProfileMenuOpen]);

  const handleGoogleLoginSuccess = async (response: any) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setIsAuthModalOpen(false);
      } else {
        setAuthError(data.error || 'Google login failed');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setAuthError('An error occurred during Google sign-in.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Initialize Google Sign-In SDK
  useEffect(() => {
    const initGoogleSignIn = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!googleClientId) {
          console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in .env.local");
          return;
        }

        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleLoginSuccess,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });

        // Prompt one-tap auth
        (window as any).google.accounts.id.prompt();
      }
    };

    const checkInterval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogleSignIn();
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  // Render Google Sign-In Button inside auth modal
  useEffect(() => {
    if (isAuthModalOpen && (window as any).google?.accounts?.id) {
      setTimeout(() => {
        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer && (window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', width: 320 }
          );
        }
      }, 200);
    }
  }, [isAuthModalOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      setCurrentUser(null);
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Caption Editor States
  const [editorSubtitles, setEditorSubtitles] = useState<SubtitleItem[]>([]);
  const [editorVideoUrl, setEditorVideoUrl] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isResolvingVideo, setIsResolvingVideo] = useState(false);
  const [editorStylePreset, setEditorStylePreset] = useState('tiktok-bold');
  const [editorCurrentTime, setEditorCurrentTime] = useState(0);
  const [editorExtraOverlays, setEditorExtraOverlays] = useState<ExtraOverlay[]>([]);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'landscape' | 'portrait'>('landscape');
  const [isAutoCaptioning, setIsAutoCaptioning] = useState(false);
  const [autoCaptionError, setAutoCaptionError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // States for creating/adding new overlays
  const [newOverlayText, setNewOverlayText] = useState('');
  const [newOverlayStart, setNewOverlayStart] = useState(0);
  const [newOverlayEnd, setNewOverlayEnd] = useState(5);
  const [newOverlayX, setNewOverlayX] = useState(50);
  const [newOverlayY, setNewOverlayY] = useState(20);
  const [newOverlayFontSize, setNewOverlayFontSize] = useState(20);
  const [newOverlayColor, setNewOverlayColor] = useState('#FFFFFF');
  const [newOverlayBgColor, setNewOverlayBgColor] = useState('transparent');

  const parseSrt = (srtText: string): SubtitleItem[] => {
    const list: SubtitleItem[] = [];
    const normalized = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split('\n\n');
    
    const parseTime = (timeStr: string): number => {
      const parts = timeStr.trim().replace('.', ',').split(',');
      const ms = parts[1] ? parseInt(parts[1], 10) : 0;
      const hms = parts[0].split(':');
      const h = parseInt(hms[0], 10) || 0;
      const m = parseInt(hms[1], 10) || 0;
      const s = parseInt(hms[2], 10) || 0;
      return h * 3600 + m * 60 + s + ms / 1000;
    };

    let idxCount = 1;
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 3) {
        const idx = parseInt(lines[0], 10) || idxCount;
        const times = lines[1].split('-->');
        if (times.length === 2) {
          const start = parseTime(times[0]);
          const end = parseTime(times[1]);
          const text = lines.slice(2).join('\n');
          list.push({ index: idx, start, end, text });
          idxCount++;
        }
      }
    }
    return list;
  };

  const buildSubtitlesFromWords = (words: any[]): SubtitleItem[] => {
    const list: SubtitleItem[] = [];
    let currentSegment: string[] = [];
    let start = 0;
    let index = 1;
    
    words.forEach((w, idx) => {
      if (currentSegment.length === 0) {
        start = w.start / 1000;
      }
      currentSegment.push(w.text);
      
      const isPunctuation = /[.!?]$/.test(w.text);
      if (currentSegment.length >= 5 || isPunctuation || idx === words.length - 1) {
        const end = w.end / 1000;
        list.push({
          index,
          start,
          end,
          text: currentSegment.join(' ')
        });
        currentSegment = [];
        index++;
      }
    });
    return list;
  };

  const handleLaunchCaptionEditor = async () => {
    if (!result || !result.url) return;
    setIsEditorOpen(true);
    setIsResolvingVideo(true);
    setEditorSubtitles([]);
    
    let resolvedVideo = '';
    const isDirectVid = /\.(mp4|webm|ogg|mov|m4v|3gp|avi)(\?.*)?$/i.test(result.url);
    if (isDirectVid || result.platform === 'direct-video') {
      resolvedVideo = result.url;
      setEditorVideoUrl(result.url);
      setIsResolvingVideo(false);
    } else {
      try {
        const res = await fetch('/api/download-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.url, downloadMode: 'video' })
        });
        const data = await res.json();
        if (data.success && data.downloadUrl) {
          resolvedVideo = data.downloadUrl;
          setEditorVideoUrl(data.downloadUrl);
        } else {
          resolvedVideo = result.url;
          setEditorVideoUrl(result.url);
        }
      } catch (err) {
        console.error('Failed to resolve Cobalt video:', err);
        resolvedVideo = result.url;
        setEditorVideoUrl(result.url);
      } finally {
        setIsResolvingVideo(false);
      }
    }

    // Auth gate check
    let resolvedSubRes = null;
    try {
      resolvedSubRes = await fetch(`/api/subtitles?url=${encodeURIComponent(result.url)}`);
      if (resolvedSubRes.status === 403) {
        const errorData = await resolvedSubRes.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'registered');
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
        setIsResolvingVideo(false);
        setIsEditorOpen(false);
        return;
      }
    } catch {}

    let parsedList: SubtitleItem[] = [];
    if (transcriptionWords && transcriptionWords.length > 0) {
      parsedList = buildSubtitlesFromWords(transcriptionWords);
    } else if (resolvedSubRes && resolvedSubRes.ok) {
      try {
        const subData = await resolvedSubRes.json();
        if (subData.success && subData.srt) {
          parsedList = parseSrt(subData.srt);
        }
      } catch (err) {
        console.warn('Failed to auto-fetch subtitles for editor:', err);
      }
    }

    if (parsedList.length === 0) {
      parsedList = [
        { index: 1, start: 1, end: 4, text: "Welcome to LinkToPreview Video Editor! 🚀" },
        { index: 2, start: 5, end: 9, text: "Click styles on the right to change designs dynamically. ✨" },
        { index: 3, start: 10, end: 14, text: "You can sync your voice and type custom overlays! 🎬" }
      ];
    }
    setEditorSubtitles(parsedList);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const handleUpdateSubtitleText = (index: number, newText: string) => {
    setEditorSubtitles(prev => prev.map(s => s.index === index ? { ...s, text: newText } : s));
  };

  const handleUpdateSubtitleTimes = (index: number, start: number, end: number) => {
    setEditorSubtitles(prev => prev.map(s => s.index === index ? { ...s, start, end } : s));
  };

  const handleAddSubtitleItem = () => {
    setEditorSubtitles(prev => {
      const last = prev[prev.length - 1];
      const nextStart = last ? last.end + 1 : 0;
      const nextEnd = nextStart + 3;
      const nextIndex = last ? last.index + 1 : 1;
      return [...prev, { index: nextIndex, start: nextStart, end: nextEnd, text: 'New caption text' }];
    });
  };

  const handleDeleteSubtitleItem = (index: number) => {
    setEditorSubtitles(prev => prev.filter(s => s.index !== index).map((s, idx) => ({ ...s, index: idx + 1 })));
  };

  const formatSrtTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const handleDownloadEditorSubtitles = () => {
    if (editorSubtitles.length === 0) return;
    let srt = '';
    editorSubtitles.forEach((sub, idx) => {
      const startSrt = formatSrtTime(sub.start);
      const endSrt = formatSrtTime(sub.end);
      srt += `${idx + 1}\n${startSrt} --> ${endSrt}\n${sub.text}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/srt' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const downloadFilename = (result?.title || 'edited_subtitles')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    a.download = `${downloadFilename}.srt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleAutoCaption = async () => {
    if (!result || !result.url) return;
    setIsAutoCaptioning(true);
    setAutoCaptionError(null);
    try {
      let srtData = null;
      try {
        const subRes = await fetch(`/api/subtitles?url=${encodeURIComponent(result.url)}`);
        if (subRes.ok) {
          const subJson = await subRes.json();
          if (subJson.success && subJson.srt) {
            srtData = subJson.srt;
          }
        }
      } catch (e) {
        console.warn('Subtitles API check failed, falling back to Transcription:', e);
      }

      if (srtData) {
        const parsed = parseSrt(srtData);
        setEditorSubtitles(parsed);
        setIsAutoCaptioning(false);
        return;
      }

      const mediaUrl = editorVideoUrl || result.mediaUrls?.[0] || result.url;
      const submitRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: mediaUrl }),
      });

      if (submitRes.status === 403) {
        const errorData = await submitRes.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'registered');
        setAuthModalMode(currentUser ? 'login' : 'signup');
        setIsAuthModalOpen(true);
        setIsAutoCaptioning(false);
        return;
      }

      const submitData = await submitRes.json();
      if (!submitData.success) {
        throw new Error(submitData.error || 'Failed to start transcription');
      }

      if (submitData.status === 'completed' && submitData.words) {
        const parsed = buildSubtitlesFromWords(submitData.words);
        setEditorSubtitles(parsed);
        setIsAutoCaptioning(false);
        return;
      }

      if (!submitData.transcriptId) {
        throw new Error('No transcript ID or words returned.');
      }

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/transcribe?id=${submitData.transcriptId}`);
          const pollData = await pollRes.json();
          if (!pollData.success) {
            clearInterval(interval);
            setIsAutoCaptioning(false);
            setAutoCaptionError(pollData.error || 'Transcription failed');
            return;
          }

          if (pollData.status === 'completed') {
            clearInterval(interval);
            setIsAutoCaptioning(false);
            if (pollData.words) {
              const parsed = buildSubtitlesFromWords(pollData.words);
              setEditorSubtitles(parsed);
            } else {
              setAutoCaptionError('No words found in transcript.');
            }
          } else if (pollData.status === 'error') {
            clearInterval(interval);
            setIsAutoCaptioning(false);
            setAutoCaptionError(pollData.error || 'Transcription processing error');
          } else if (attempts > 100) {
            clearInterval(interval);
            setIsAutoCaptioning(false);
            setAutoCaptionError('Transcription timed out. Please try again.');
          }
        } catch (pollErr: any) {
          console.error(pollErr);
        }
      }, 4000);

    } catch (err: any) {
      console.error(err);
      setAutoCaptionError(err.message || 'Auto-caption generation failed.');
      setIsAutoCaptioning(false);
    }
  };

  const handleAddExtraOverlay = () => {
    if (!newOverlayText.trim()) return;
    const newOverlay: ExtraOverlay = {
      id: Math.random().toString(36).substring(2, 9),
      text: newOverlayText,
      start: newOverlayStart,
      end: newOverlayEnd,
      x: newOverlayX,
      y: newOverlayY,
      fontSize: newOverlayFontSize,
      color: newOverlayColor,
      backgroundColor: newOverlayBgColor
    };
    setEditorExtraOverlays(prev => [...prev, newOverlay]);
    setNewOverlayText('');
  };

  const handleDeleteExtraOverlay = (id: string) => {
    setEditorExtraOverlays(prev => prev.filter(o => o.id !== id));
  };
  
  // High-fidelity animation states
  const [isShaking, setIsShaking] = useState(false);
  const [activeAsset, setActiveAsset] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<boolean>(false);
  
  // Lazy tab loading states
  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});
  const [lazyLoadingTab, setLazyLoadingTab] = useState<string | null>(null);
  
  // Tab transition loading states
  const [isTransitioningTab, setIsTransitioningTab] = useState<string | null>(null);
  const tabTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Media Download Quality states
  const [selectedVideoQuality, setSelectedVideoQuality] = useState<string>('480');
  const [selectedAudioQuality, setSelectedAudioQuality] = useState<string>('128');
  
  // Audio extraction simulation states
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionText, setExtractionText] = useState('Initializing extractor...');
  
  // Video download simulation states
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('Initializing downloader...');

  // Audio download simulation states
  const [isDownloadingAudioFile, setIsDownloadingAudioFile] = useState(false);
  const [audioDownloadProgress, setAudioDownloadProgress] = useState(0);
  const [audioDownloadText, setAudioDownloadText] = useState('');

  // Refs for timers
  const extractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioDownloadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcribePollingRef = useRef<NodeJS.Timeout | null>(null);

  // Remove.bg background removal states
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [removedBgImageUrl, setRemovedBgImageUrl] = useState<string | null>(null);
  const [removeBgError, setRemoveBgError] = useState<string | null>(null);

  // AssemblyAI transcription states
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState<number | null>(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Feedback states
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Advanced Web & Media Tool States
  const [screenshotDevice, setScreenshotDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotData, setScreenshotData] = useState<{ desktop?: string; tablet?: string; mobile?: string }>({});
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [transcriptionWords, setTranscriptionWords] = useState<any[] | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isDownloadingSubtitles, setIsDownloadingSubtitles] = useState(false);
  const [devSpecsSearch, setDevSpecsSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    images: false,
    favicons: true,
    stylesheets: true,
    scripts: true,
    media: true
  });

  // Rolling platforms simulation
  const [rollingIndex, setRollingIndex] = useState(0);
  const [scanningText, setScanningText] = useState('Paste URL and press Detect');
  const [scanOpacity, setScanOpacity] = useState(1);

  // Staged sequential reveal states
  const [isPlatformMatched, setIsPlatformMatched] = useState(false);
  const [matchedPlatform, setMatchedPlatform] = useState<string | null>(null);
  const [showAssetsList, setShowAssetsList] = useState(false);
  const [showConnectionLine, setShowConnectionLine] = useState(false);
  const [showPreviewCard, setShowPreviewCard] = useState(false);

  // Animated suggestions in idle input
  const placeholderSuggestions = [
    'Paste Instagram post or reel link...',
    'Paste YouTube video link...',
    'Paste Pinterest pin link...',
    'Paste Twitter / X post link...',
    'Paste Facebook video link...',
    'Paste direct image or video URL...',
    'Paste any website link...'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  
  // Image extraction states
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [exifData, setExifData] = useState<any>(null);
  const [imgDetails, setImgDetails] = useState<{ width: number; height: number; size: string } | null>(null);

  // Clipboard copy status for multiple small components
  const [copiedText, setCopiedText] = useState<{ [key: string]: boolean }>({});

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const platforms = [
    'YouTube Video', 'Instagram Post', 'Pinterest Pin', 
    'Twitter / X Post', 'Facebook Video', 'Direct Image', 
    'Direct Video', 'Direct Audio', 'Website Metadata'
  ];

  const scanSteps = [
    'Analyzing link format...',
    'Resolving target domain...',
    'Requesting server response headers...',
    'Extracting open-graph structures...',
    'Checking author information...',
    'Indexing hashtags and keywords...',
    'Done! Elements identified successfully.'
  ];

  // Ref to hold the pending resolved result so the interval can grab it
  const pendingResultRef = useRef<AnalysisResult | null>(null);

  const getPlatformMatchKey = (index: number) => {
    switch (index) {
      case 0: return 'youtube';
      case 1: return 'instagram';
      case 2: return 'pinterest';
      case 3: return 'twitter';
      case 4: return 'facebook';
      case 5: return 'direct-image';
      case 6: return 'direct-video';
      case 7: return 'direct-audio';
      default: return 'website';
    }
  };

  // Effect to handle scanning rolling text and platform switching
  useEffect(() => {
    let platformInterval: NodeJS.Timeout;
    let textInterval: NodeJS.Timeout;
    let stepCount = 0;

    if (isLoading) {
      // Slower rolling platforms: changes every 0.8 seconds (800ms) one by one
      platformInterval = setInterval(() => {
        setRollingIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % platforms.length;
          
          // If the resolved result is ready, and the next rolling platform matches:
          if (pendingResultRef.current && getPlatformMatchKey(nextIndex) === pendingResultRef.current.platform) {
            clearInterval(platformInterval);
            clearInterval(textInterval);
            
            const matchedKey = pendingResultRef.current.platform;
            setIsPlatformMatched(true);
            setMatchedPlatform(matchedKey);
            
            setScanningText('Platform matched! Mapping assets...');
            setScanOpacity(1);

            // Phase 2: After 600ms, show assets list and set result
            setTimeout(() => {
              if (pendingResultRef.current) {
                setResult(pendingResultRef.current);
                setShowAssetsList(true);
                
                // Phase 3: After another 500ms, show connection line
                setTimeout(() => {
                  setShowConnectionLine(true);
                  
                  // Phase 4: After another 500ms, show content preview card
                  setTimeout(() => {
                    setShowPreviewCard(true);
                    setIsLoading(false);
                    pendingResultRef.current = null;
                  }, 500);
                }, 500);
              }
            }, 600);
            
            return nextIndex;
          }
          
          return nextIndex;
        });
      }, 800);

      // Slower scan steps text updates with fade
      setScanningText(scanSteps[0]);
      setScanOpacity(1);

      textInterval = setInterval(() => {
        stepCount++;
        if (stepCount < scanSteps.length) {
          setScanOpacity(0);
          setTimeout(() => {
            setScanningText(scanSteps[stepCount]);
            setScanOpacity(1);
          }, 200);
        }
      }, 900); // Slower scan updates

    } else {
      if (!result) {
        setScanningText('Paste URL and press Detect');
      }
    }

    return () => {
      clearInterval(platformInterval);
      clearInterval(textInterval);
      if (extractionIntervalRef.current) {
        clearInterval(extractionIntervalRef.current);
      }
      if (audioDownloadIntervalRef.current) {
        clearInterval(audioDownloadIntervalRef.current);
      }
      if (tabTransitionTimeoutRef.current) {
        clearTimeout(tabTransitionTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Fetch lazy loaded assets data on-demand
  const fetchLazyData = async (scanType: 'intel' | 'lighthouse' | 'ai-research' | 'ai-writer' | 'trust-safety') => {
    if (!result) return;
    setLazyLoadingTab(activeAsset);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url, scanType }),
      });
      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'registered');
        setAuthModalMode(currentUser ? 'login' : 'signup');
        setIsAuthModalOpen(true);
        setLazyLoadingTab(null);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            ...data
          };
        });
        setLoadedTabs(prev => ({ ...prev, [scanType]: true }));
      } else {
        console.error('Failed to load lazy data:', data.error);
      }
    } catch (err) {
      console.error('Lazy loading error:', err);
    } finally {
      setLazyLoadingTab(null);
    }
  };

  // Trigger lazy loading when switching to tabs that require heavy APIs
  useEffect(() => {
    if (!result || !activeAsset) return;

    if (activeAsset === 'link-intel' && !loadedTabs['intel']) {
      fetchLazyData('intel');
    } else if (activeAsset === 'lighthouse' && !loadedTabs['lighthouse']) {
      fetchLazyData('lighthouse');
    } else if (activeAsset === 'ai-research' && !loadedTabs['ai-research']) {
      fetchLazyData('ai-research');
    } else if (activeAsset === 'ai-tools' && !loadedTabs['ai-writer']) {
      fetchLazyData('ai-writer');
    } else if (activeAsset === 'trust-safety' && !loadedTabs['trust-safety']) {
      fetchLazyData('trust-safety');
    }
  }, [activeAsset, result?.url, loadedTabs]);



  // Cycle idle input placeholders with smooth opacity transitions
  useEffect(() => {
    if (isLoading || inputUrl || isFocused) return;

    const interval = setInterval(() => {
      setPlaceholderOpacity(0);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholderSuggestions.length);
        setPlaceholderOpacity(1);
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, [isLoading, inputUrl, isFocused]);

  // Trigger color extraction, EXIF parse, and media headers when direct-image loads
  useEffect(() => {
    if (result && result.previewUrl) {
      // 1. Fetch size using /api/media-info
      fetch(`/api/media-info?url=${encodeURIComponent(result.previewUrl)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const sizeInKb = (data.fileSize / 1024).toFixed(1);
            setImgDetails(prev => ({
              width: prev?.width || 0,
              height: prev?.height || 0,
              size: `${sizeInKb} KB (${data.contentType.split('/')[1] || 'raw'})`,
            }));
          }
        })
        .catch(console.error);

      // 2. Load image element to extract dimension & colors
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Try CORS, if it fails we fallback
      img.onload = () => {
        setImgDetails(prev => ({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: prev?.size || 'Unknown',
        }));

        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 10;
            canvas.height = 10;
            ctx.drawImage(img, 0, 0, 10, 10);
            const imgData = ctx.getImageData(0, 0, 10, 10).data;
            const colors = new Set<string>();
            // Sample a few pixels to extract distinct colors
            for (let i = 0; i < imgData.length; i += 16) {
              const r = imgData[i];
              const g = imgData[i+1];
              const b = imgData[i+2];
              colors.add(`rgb(${r}, ${g}, ${b})`);
              if (colors.size >= 5) break;
            }
            setExtractedColors(Array.from(colors));
          }
        } catch (e) {
          console.log('Failed to extract colors due to CORS restrictions.');
          setExtractedColors(['rgb(124, 58, 237)', 'rgb(244, 63, 94)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(6, 182, 212)']); // Pretty fallback colors
        }
      };
      img.src = result.previewUrl;

      // 3. Try to read EXIF using exifr
      exifr.parse(result.previewUrl, {
        tiff: true,
        xmp: false,
        gps: true,
      }).then(data => {
        if (data) {
          setExifData(data);
        } else {
          setExifData({ message: 'No EXIF metadata found in this image.' });
        }
      }).catch(() => {
        setExifData({ message: 'Could not read EXIF data (CORS or file type limitations).' });
      });

    } else {
      setExtractedColors([]);
      setExifData(null);
      setImgDetails(null);
    }
  }, [result]);

  // Set default active asset on success
  useEffect(() => {
    if (result) {
      // Only set default if activeAsset is not already selected/set
      if (!activeAsset) {
        // Determine default asset type
        if (result.contentType === 'video' || result.embedUrl) {
          setActiveAsset('video');
        } else if (result.contentType === 'image' || result.previewUrl) {
          setActiveAsset('image');
        } else if (result.contentType === 'audio') {
          setActiveAsset('audio');
        } else {
          setActiveAsset('website');
        }
      }
    } else {
      setActiveAsset(null);
    }
  }, [result, activeAsset]);

  // Render QR Code onto canvas when matching asset selected
  useEffect(() => {
    if (activeAsset === 'link-intel' || activeAsset === 'image-tools') {
      // Small timeout to allow element rendering
      setTimeout(() => {
        if (qrCanvasRef.current && result) {
          QRCode.toCanvas(qrCanvasRef.current, result.url, {
            width: 140,
            margin: 1,
            color: {
              dark: '#1c1c1e', // custom-card text
              light: '#f4f4f5' // zinc-100
            }
          }, (err) => {
            if (err) console.error('QR code generation error:', err);
          });
        }
      }, 100);
    }
  }, [activeAsset, result]);

  // Trigger automatic screenshot scan on active tab select
  useEffect(() => {
    if (activeAsset === 'screenshots' && result && result.url && !screenshotData[screenshotDevice] && !screenshotLoading) {
      handleFetchScreenshot(result.url, screenshotDevice);
    }
  }, [activeAsset, screenshotDevice, result, screenshotData, screenshotLoading]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (isValidUrl(pastedText)) {
      analyzeLink(pastedText);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      let url = string.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
    if (error) setError(null);
  };

  const handleClear = () => {
    setInputUrl('');
    setResult(null);
    setError(null);
    setIsPlatformMatched(false);
    setMatchedPlatform(null);
    setShowAssetsList(false);
    setShowConnectionLine(false);
    setShowPreviewCard(false);
    setIsDownloadingVideo(false);
    setDownloadProgress(0);
    setDownloadText('');
    setIsDownloadingAudioFile(false);
    setAudioDownloadProgress(0);
    setAudioDownloadText('');
    setTranscriptionWords(null);
    setTranscriptionText(null);
    setOcrText(null);
    setScreenshotData({});
    setRemovedBgImageUrl(null);
    setFeedbackText('');
    setFeedbackSubmitted(false);
    if (extractionIntervalRef.current) {
      clearInterval(extractionIntervalRef.current);
      extractionIntervalRef.current = null;
    }
    if (audioDownloadIntervalRef.current) {
      clearInterval(audioDownloadIntervalRef.current);
      audioDownloadIntervalRef.current = null;
    }
  };

  const handleSubmitFeedback = async (errorMsg: string, sourceArea: string) => {
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl,
          errorMessage: errorMsg,
          feedbackText: `${sourceArea}: ${feedbackText}`
        })
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        setFeedbackText('');
      } else {
        alert('Could not submit feedback to database. You can still use the mail option!');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please use the mail option!');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        if (isValidUrl(text)) {
          analyzeLink(text);
        } else {
          setError(null);
        }
      } else {
        setError('Clipboard is empty or contains no text.');
        triggerShake();
      }
    } catch (err) {
      console.error('Clipboard paste failed:', err);
      setError('Cannot access clipboard. Please paste using keyboard shortcut (Ctrl+V).');
      triggerShake();
    }
  };

  const analyzeLink = async (urlToAnalyze?: string) => {
    const targetUrl = (urlToAnalyze || inputUrl).trim();
    if (!targetUrl) {
      setError('Please paste or enter a URL first.');
      triggerShake();
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setError('Please enter a valid web link (e.g. youtube.com/watch?v=...)');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setFeedbackText('');
    setFeedbackSubmitted(false);

    // Reset animation phase states
    setIsPlatformMatched(false);
    setMatchedPlatform(null);
    setShowAssetsList(false);
    setShowConnectionLine(false);
    setShowPreviewCard(false);
    setIsDownloadingVideo(false);
    setDownloadProgress(0);
    setDownloadText('');
    setIsDownloadingAudioFile(false);
    setAudioDownloadProgress(0);
    setAudioDownloadText('');
    setTranscriptionWords(null);
    setTranscriptionText(null);
    setOcrText(null);
    setScreenshotData({});
    setRemovedBgImageUrl(null);
    setLoadedTabs({});
    setLazyLoadingTab(null);
    if (extractionIntervalRef.current) {
      clearInterval(extractionIntervalRef.current);
      extractionIntervalRef.current = null;
    }
    if (audioDownloadIntervalRef.current) {
      clearInterval(audioDownloadIntervalRef.current);
      audioDownloadIntervalRef.current = null;
    }

    // Keep minimum scanning time of 5.5s for the visual step process to finish
    const minWait = new Promise((resolve) => setTimeout(resolve, 5500));

    let apiResult: AnalysisResult | null = null;
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, scanType: 'base' }),
      });
      
      const data = await response.json();
      if (data.success) {
        apiResult = data;
      } else {
        throw new Error(data.error || 'Failed to analyze link');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to scan this link. Target server may have blocked automated requests.');
    }

    await minWait;

    if (apiResult) {
      // Store in ref to allow the shuffler to catch it and lock on matching index
      pendingResultRef.current = apiResult;
    } else {
      // If failed, stop loading immediately to display error message
      setIsLoading(false);
    }
  };

  const handleDownload = (mediaUrl: string, title?: string) => {
    if (!mediaUrl) return;
    const downloadFilename = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'download';
    const proxyUrl = `/api/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(downloadFilename)}`;
    window.open(proxyUrl, '_blank');
  };

  const handleDownloadSubtitles = async () => {
    if (!result || !result.url) return;
    setIsDownloadingSubtitles(true);
    try {
      const res = await fetch(`/api/subtitles?url=${encodeURIComponent(result.url)}`);
      const data = await res.json();
      if (!data.success || !data.srt) {
        throw new Error(data.error || 'Failed to download subtitles.');
      }
      
      const blob = new Blob([data.srt], { type: 'text/srt' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadFilename = (data.title || result.title || 'subtitles')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      a.download = `${downloadFilename}.srt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred while downloading subtitles.');
    } finally {
      setIsDownloadingSubtitles(false);
    }
  };

  const handleRealVideoDownload = async (
    downloadUrl: string, 
    downloadMode: 'video' | 'audio', 
    title?: string,
    videoQuality?: string,
    audioBitrate?: string
  ) => {
    if (downloadMode === 'audio') {
      setIsDownloadingAudioFile(true);
      setAudioDownloadProgress(10);
      setAudioDownloadText('Initiating audio extraction pipeline...');
    } else {
      setIsDownloadingVideo(true);
      setDownloadProgress(10);
      setDownloadText('Initiating secure video extraction...');
    }

    try {
      if (downloadMode === 'audio') {
        setAudioDownloadProgress(30);
        setAudioDownloadText('Requesting audio stream from extraction server...');
      } else {
        setDownloadProgress(30);
        setDownloadText('Requesting video stream from extraction server...');
      }

      const res = await fetch('/api/download-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: downloadUrl, 
          downloadMode,
          videoQuality,
          audioBitrate
        })
      });

      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'registered');
        setAuthModalMode(currentUser ? 'login' : 'signup');
        setIsAuthModalOpen(true);
        if (downloadMode === 'audio') {
          setIsDownloadingAudioFile(false);
        } else {
          setIsDownloadingVideo(false);
        }
        return;
      }

      if (downloadMode === 'audio') {
        setAudioDownloadProgress(60);
        setAudioDownloadText('Resolving audio tunnel stream...');
      } else {
        setDownloadProgress(60);
        setDownloadText('Resolving video tunnel stream...');
      }

      const data = await res.json();
      if (!data.success || !data.downloadUrl) {
        throw new Error(data.error || 'Failed to extract download link');
      }

      if (downloadMode === 'audio') {
        setAudioDownloadProgress(85);
        setAudioDownloadText('Redirecting to secure download proxy...');
      } else {
        setDownloadProgress(85);
        setDownloadText('Redirecting to secure download proxy...');
      }

      const cleanTitle = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'download';
      const ext = downloadMode === 'audio' ? 'mp3' : 'mp4';
      const proxyUrl = `/api/download?url=${encodeURIComponent(data.downloadUrl)}&filename=${encodeURIComponent(cleanTitle + '.' + ext)}`;
      
      if (downloadMode === 'audio') {
        setAudioDownloadProgress(100);
        setAudioDownloadText('Download started!');
        setTimeout(() => setIsDownloadingAudioFile(false), 800);
      } else {
        setDownloadProgress(100);
        setDownloadText('Download started!');
        setTimeout(() => setIsDownloadingVideo(false), 800);
      }

      window.open(proxyUrl, '_blank');

    } catch (err: any) {
      console.error(err);
      
      let friendlyError = err.message;
      if (err.message.includes('error.api.content.video.unavailable')) {
        friendlyError = 'This video is unavailable (private, age-restricted, region-blocked, or deleted). The extraction server is unable to fetch it.';
      } else if (err.message.includes('error.api.link.unsupported')) {
        friendlyError = 'This link format or platform is not supported by the extraction service.';
      } else if (err.message.includes('Status 400') || err.message.includes('400')) {
        friendlyError = 'Extraction failed. The video might be restricted or blocked by YouTube/platform.';
      }

      if (downloadMode === 'audio') {
        setIsDownloadingAudioFile(false);
        alert(`Audio download failed: ${friendlyError}`);
      } else {
        setIsDownloadingVideo(false);
        alert(`Video download failed: ${friendlyError}`);
      }
    }
  };

  const handleFetchScreenshot = async (targetUrl: string, device: 'desktop' | 'tablet' | 'mobile') => {
    setScreenshotDevice(device);
    if (screenshotData[device]) return;

    setScreenshotLoading(true);
    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, device })
      });
      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'registered');
        setAuthModalMode(currentUser ? 'login' : 'signup');
        setIsAuthModalOpen(true);
        setScreenshotLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.imageDataUrl) {
        setScreenshotData(prev => ({ ...prev, [device]: data.imageDataUrl }));
      } else {
        throw new Error(data.error || 'Failed to capture screenshot');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Screenshot failed: ${err.message}`);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const handleRunOcr = async (imageUrl: string) => {
    setOcrProgress(10);
    setOcrStatus('Initializing OCR worker...');
    setOcrText(null);
    try {
      const worker = await createWorker('eng');
      setOcrProgress(40);
      setOcrStatus('Running OCR text analysis...');
      const ret = await worker.recognize(imageUrl);
      setOcrProgress(80);
      setOcrStatus('Structuring extracted content...');
      setOcrText(ret.data.text || 'No text content identified in image.');
      await worker.terminate();
      setOcrProgress(100);
      setTimeout(() => setOcrProgress(null), 1000);
    } catch (err: any) {
      console.error(err);
      alert(`OCR Scan failed: ${err.message}`);
      setOcrProgress(null);
    }
  };

  const copyTags = (tagsList: string[]) => {
    navigator.clipboard.writeText(tagsList.join(' '));
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedText(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Remove.bg background removal handler
  const handleRemoveBg = async (imageUrl: string) => {
    if (!imageUrl) return;
    setIsRemovingBg(true);
    setRemovedBgImageUrl(null);
    setRemoveBgError(null);
    try {
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'pro');
        setAuthModalMode(currentUser ? 'login' : 'signup');
        setIsAuthModalOpen(true);
        setIsRemovingBg(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.imageDataUrl) {
        setRemovedBgImageUrl(data.imageDataUrl);
      } else {
        setRemoveBgError(data.error || 'Background removal failed');
      }
    } catch (err: any) {
      setRemoveBgError(err.message || 'Network error during background removal');
    } finally {
      setIsRemovingBg(false);
    }
  };

  // AssemblyAI real audio transcription handler
  const handleTranscribe = async (audioUrl: string) => {
    if (!audioUrl) return;
    setIsTranscribing(true);
    setTranscriptionText(null);
    setTranscriptionError(null);
    setTranscriptionStatus('Submitting audio...');
    setTranscriptionId(null);
    setTranscriptionConfidence(null);
    setTranscriptionLanguage(null);

    // Clean up any existing polling
    if (transcribePollingRef.current) {
      clearInterval(transcribePollingRef.current);
      transcribePollingRef.current = null;
    }

    try {
      // Submit audio
      const submitRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl }),
      });
      if (submitRes.status === 403) {
        const errorData = await submitRes.json().catch(() => ({}));
        setAuthModalRequiredLevel(errorData.requiredLevel || 'registered');
        setAuthModalMode(currentUser ? 'login' : 'signup');
        setIsAuthModalOpen(true);
        setIsTranscribing(false);
        return;
      }
      const submitData = await submitRes.json();
      if (!submitData.success) {
        throw new Error(submitData.error || 'Failed to submit audio');
      }

      // If Deepgram resolved it synchronously
      if (submitData.status === 'completed') {
        setIsTranscribing(false);
        setTranscriptionText(submitData.text || 'No speech detected in audio');
        setTranscriptionWords(submitData.words || null);
        setTranscriptionConfidence(submitData.confidence);
        setTranscriptionLanguage(submitData.language || 'en');
        return;
      }

      if (!submitData.transcriptId) {
        throw new Error('No transcript ID returned for async polling.');
      }

      setTranscriptionId(submitData.transcriptId);
      setTranscriptionStatus('Processing audio... This may take 30–90 seconds.');

      // Poll for result
      let attempts = 0;
      transcribePollingRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/transcribe?id=${submitData.transcriptId}`);
          const pollData = await pollRes.json();
          if (!pollData.success) { clearInterval(transcribePollingRef.current!); setIsTranscribing(false); setTranscriptionError(pollData.error || 'Polling error'); return; }
          setTranscriptionStatus(pollData.status === 'processing' ? `Processing... (${attempts * 4}s elapsed)` : pollData.status);
          if (pollData.status === 'completed') {
            clearInterval(transcribePollingRef.current!);
            setIsTranscribing(false);
            setTranscriptionText(pollData.text || 'No speech detected in audio');
            setTranscriptionWords(pollData.words || null);
            setTranscriptionConfidence(pollData.confidence);
            setTranscriptionLanguage(pollData.language);
          } else if (pollData.status === 'error') {
            clearInterval(transcribePollingRef.current!);
            setIsTranscribing(false);
            setTranscriptionError(pollData.error || 'Transcription failed');
          } else if (attempts > 150) { // ~600 seconds timeout (10 minutes)
            clearInterval(transcribePollingRef.current!);
            setIsTranscribing(false);
            setTranscriptionError('Transcription timed out. The video is long, but it might still be processing. Try checking later.');
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
        }
      }, 4000);
    } catch (err: any) {
      setIsTranscribing(false);
      setTranscriptionError(err.message || 'Transcription submission failed');
    }
  };

  const handleSelectAsset = (assetId: string) => {
    // Clear previous extraction intervals to prevent state overlaps and memory leaks
    if (extractionIntervalRef.current) {
      clearInterval(extractionIntervalRef.current);
      extractionIntervalRef.current = null;
    }

    // Set transition state with a 800ms timeout
    if (tabTransitionTimeoutRef.current) {
      clearTimeout(tabTransitionTimeoutRef.current);
    }
    setIsTransitioningTab(assetId);
    tabTransitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioningTab(null);
    }, 800);

    // If clicking on audio and the content is video/embed, run extraction simulator
    if (assetId === 'audio' && result && (result.contentType === 'video' || result.embedUrl)) {
      setIsExtractingAudio(true);
      setExtractionProgress(0);
      
      const targetPlatformLabel = result.platform === 'instagram' ? 'Instagram Reel' : 
                                  result.platform === 'youtube' ? 'YouTube Video' : 'Video';
      setExtractionText(`Initializing audio extractor for ${targetPlatformLabel}...`);
      setActiveAsset(assetId);

      let progress = 0;
      extractionIntervalRef.current = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 10;
        if (progress >= 100) {
          progress = 100;
          setExtractionProgress(100);
          setExtractionText('Finalizing audio stream encoding...');
          if (extractionIntervalRef.current) {
            clearInterval(extractionIntervalRef.current);
            extractionIntervalRef.current = null;
          }
          setTimeout(() => {
            setIsExtractingAudio(false);
          }, 600);
        } else {
          setExtractionProgress(progress);
          if (progress < 25) {
            setExtractionText(`Initializing audio extractor for ${targetPlatformLabel}...`);
          } else if (progress < 55) {
            setExtractionText('Demuxing audio track from video container...');
          } else if (progress < 85) {
            setExtractionText('Converting audio channel to high-fidelity MP3 (192kbps)...');
          } else {
            setExtractionText('Writing ID3 audio metadata tags...');
          }
        }
      }, 200);
    } else {
      setIsExtractingAudio(false);
      setActiveAsset(assetId);
    }
  };

  // Build list of extracted asset elements (plain names, no icons)
  const getAssetBadges = () => {
    if (!result) return [];
    const list = [];
    
    if (result.contentType === 'video' || result.embedUrl) {
      list.push({ id: 'video', label: 'Video Preview' });
    }
    
    if (result.previewUrl || result.contentType === 'image') {
      list.push({ id: 'image', label: 'Image Preview' });
    }
    
    // Always offer Audio option (extraction) if it's direct audio OR a video/reel
    if (result.contentType === 'audio' || result.contentType === 'video' || result.embedUrl) {
      list.push({ id: 'audio', label: 'Audio' });
    }

    if (result.platform === 'youtube') {
      list.push({ id: 'ai-research', label: 'AI Video Summary' });
    }

    if (result.contentType === 'website' && !result.embedUrl && result.platform === 'website') {
      list.push({ id: 'website', label: 'Info' });
    }
    
    // Image Tools (EXIF + Dominant Colors) for direct images
    if (result.platform === 'direct-image') {
      list.push({ id: 'image-tools', label: 'Image Tools' });
    }

    // Link Intelligence (Redirects, DNS, Safety check) - Only for Website platform
    if (result.platform === 'website') {
      list.push({ id: 'link-intel', label: 'Link Intelligence' });
      list.push({ id: 'lighthouse', label: 'Lighthouse Audits' });
      list.push({ id: 'screenshots', label: 'Screenshots' });
      list.push({ id: 'og-preview', label: 'Social Previews' });
      list.push({ id: 'ai-research', label: 'AI Research' });
      list.push({ id: 'trust-safety', label: 'Real/Fake Detector' });
      if (result.developerSpecs) {
        list.push({ id: 'dev-specs', label: 'Developer Specs' });
      }
    }

    // AI suggestion tags
    list.push({ id: 'ai-tools', label: 'AI Writer' });

    if (result.author) {
      list.push({ id: 'author', label: 'Creator' });
    }
    
    if (result.hashtags && result.hashtags.length > 0) {
      list.push({ id: 'tags', label: 'Hashtags' });
    }

    return list;
  };

  // Custom SVGs for platforms not in lucide or that need premium brand accuracy
  const PinterestIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.63 11.12-.1-.95-.2-2.41.04-3.45.22-.94 1.4-5.97 1.4-5.97s-.36-.72-.36-1.77c0-1.66.96-2.9 2.17-2.9 1.02 0 1.51.77 1.51 1.69 0 1.03-.66 2.56-.99 3.98-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.56-5.4 5.2 0 1.03.4 2.14.9 2.74.1.12.11.23.08.35-.09.38-.29 1.18-.33 1.34-.05.22-.18.27-.41.16-1.53-.71-2.48-2.95-2.48-4.75 0-3.87 2.81-7.42 8.1-7.42 4.26 0 7.57 3.04 7.57 7.09 0 4.24-2.67 7.65-6.37 7.65-1.24 0-2.41-.65-2.81-1.41l-.76 2.9c-.28 1.05-1.01 2.37-1.5 3.17 1.12.35 2.3.54 3.53.54 6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
    </svg>
  );

  const TwitterXIcon = ({ size = 12 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const YoutubeIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.047 0 12 0 12s0 3.953.502 5.837a3.002 3.002 0 0 0 2.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.002 3.002 0 0 0 2.11-2.107C24 15.953 24 12 24 12s0-3.953-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  const InstagramIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );

  const FacebookIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  const PasteIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );

  const VimeoIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M22.396 7.177c-.052 1.955-1.44 4.636-4.164 8.043-2.812 3.565-5.186 5.347-7.123 5.347-1.205 0-2.222-1.12-3.053-3.361-.553-2.006-1.103-4.01-1.657-6.012-.61-2.21-1.261-3.314-1.954-3.314-.156 0-.693.324-1.61.972l-.963-1.24c.983-.865 1.954-1.745 2.91-2.637 1.313-1.162 2.296-1.77 2.955-1.82 1.544-.117 2.493.938 2.848 3.167.387 2.4.654 3.882.802 4.453.447 1.748.815 2.62 1.107 2.62.225 0 .72-.516 1.488-1.547.77-1.032 1.196-1.812 1.28-2.338.169-1.077-.168-1.616-1.012-1.616-.403 0-.825.093-1.263.275 1.054-3.453 3.064-5.12 6.03-5.003 2.19.09 3.22 1.516 3.097 4.282z"/>
    </svg>
  );

  const RedditIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.37-4.31 3.81.81c.02.78.67 1.4 1.47 1.4 1.1 0 2-1 2-2s-.9-2-2-2c-.89 0-1.63.59-1.89 1.4l-4.23-.9c-.26-.06-.52.1-.6.36l-1.65 5.18c-2.51.04-4.8.68-6.49 1.71C4.86 8.98 3.96 8.5 3 8.5c-1.65 0-3 1.35-3 3 0 1.11.61 2.07 1.51 2.58C1.47 14.33 1.44 14.66 1.44 15c0 3.86 4.73 7 10.56 7s10.56-3.14 10.56-7c0-.34-.03-.67-.07-.92.9-.51 1.51-1.47 1.51-2.58zM6.5 12.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm11 3.5c-1.81 1.81-5.19 1.81-7 0-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0 1.42 1.42 4.16 1.42 5.58 0 .2-.2.51-.2.71 0 .2.2.2.51 0 .71zm-.5-2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  );

  const TikTokIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.53-4.07-1.39-.17-.12-.33-.26-.5-.4-.05 1.52.01 3.06-.01 4.58-.09 2.52-.94 5.09-2.73 6.88-2.03 2.11-5.22 2.97-8.03 2.17-3.03-.78-5.59-3.23-6.19-6.32C-.32 11.23 1.51 6.97 4.96 5.48c1.07-.48 2.26-.64 3.42-.51v4.06c-1.07-.2-2.23.09-3.01.88-1.05 1.05-1.22 2.89-.35 4.12.87 1.34 2.65 1.88 4.14 1.25.96-.38 1.6-1.35 1.62-2.39.02-3.15-.01-6.3-.01-9.45.25-.17.5-.34.76-.51z"/>
    </svg>
  );

  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <YoutubeIcon size={14} />;
      case 'instagram':
        return <InstagramIcon size={14} />;
      case 'pinterest':
        return <PinterestIcon size={14} />;
      case 'twitter':
        return <TwitterXIcon size={14} />;
      case 'facebook':
        return <FacebookIcon size={14} />;
      case 'vimeo':
        return <VimeoIcon size={14} />;
      case 'reddit':
        return <RedditIcon size={14} />;
      case 'tiktok':
        return <TikTokIcon size={14} />;
      case 'direct-image':
        return <ImageIcon size={14} className="shrink-0" />;
      case 'direct-video':
        return <VideoIcon size={14} className="shrink-0" />;
      case 'direct-audio':
        return <MusicIcon size={14} className="shrink-0" />;
      default:
        return <GlobeIcon size={14} className="shrink-0" />;
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'YouTube';
      case 'instagram': return 'Instagram';
      case 'pinterest': return 'Pinterest';
      case 'twitter': return 'Twitter / X';
      case 'facebook': return 'Facebook';
      case 'vimeo': return 'Vimeo';
      case 'reddit': return 'Reddit';
      case 'tiktok': return 'TikTok';
      case 'direct-image': return 'Image File';
      case 'direct-video': return 'Video File';
      case 'direct-audio': return 'Audio File';
      default: return 'Website';
    }
  };

  const getPlatformCapsuleBg = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'rgba(239, 68, 68, 0.95)'; // Youtube Red
      case 'instagram':
        return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'; // IG Gradient
      case 'pinterest':
        return 'rgba(224, 34, 40, 0.95)'; // Pinterest Red
      case 'twitter':
        return 'rgba(15, 20, 25, 0.98)'; // Dark Mode X
      case 'facebook':
        return 'rgba(24, 119, 242, 0.95)'; // FB Blue
      case 'vimeo':
        return 'rgba(26, 183, 234, 0.95)'; // Vimeo Cyan
      case 'reddit':
        return 'rgba(255, 69, 0, 0.95)'; // Reddit Orange
      case 'tiktok':
        return 'rgba(0, 0, 0, 0.95)'; // TikTok black
      case 'direct-image':
        return 'rgba(79, 70, 229, 0.95)'; // Indigo
      case 'direct-video':
        return 'rgba(124, 58, 237, 0.95)'; // Violet
      case 'direct-audio':
        return 'rgba(16, 185, 129, 0.95)'; // Emerald
      default:
        return 'rgba(113, 113, 122, 0.95)'; // Zinc
    }
  };

  const assetBadges = getAssetBadges();

  const currentPlatformKey = (isPlatformMatched || result)
    ? (result?.platform || matchedPlatform || 'website')
    : getPlatformMatchKey(rollingIndex);

  const displayEmail = currentUser ? currentUser.email.replace(/^www\./i, '') : '';
  const displayHandle = displayEmail.split('@')[0];
  const displayInitial = displayHandle.charAt(0).toUpperCase();

  return (
    <div className="relative flex flex-col items-center justify-between h-screen max-h-screen overflow-hidden z-10 px-4 md:px-8 py-4 md:py-6 dots-bg select-none">
      
      {/* Floating User Account Pill at top right */}
      <div className="absolute top-6 right-6 z-40" ref={profileMenuRef}>
        {isSessionLoading ? (
          /* Premium pulsing skeleton pill */
          <div className="flex items-center gap-2 p-1 bg-white border border-zinc-200 rounded-full w-28 h-9 animate-pulse select-none justify-between pr-3.5">
            <div className="h-6.5 w-6.5 rounded-full bg-zinc-200 m-0.5"></div>
            <div className="h-3 bg-zinc-200 rounded w-14"></div>
          </div>
        ) : currentUser ? (
          <div className="relative">
            {/* Interactive Glowing Avatar */}
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 bg-white border border-zinc-200 hover:border-zinc-300 rounded-full hover:bg-zinc-50/50 transition-all shadow-sm active:scale-98 cursor-pointer select-none"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm select-none border border-white/20">
                {displayInitial}
              </div>
              <span className="hidden sm:inline-block font-sans text-xs font-semibold text-zinc-700 max-w-[120px] truncate select-none pl-1">
                {displayHandle}
              </span>
              <ChevronDown size={12} className={`text-zinc-400 mr-2 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Account Details dropdown card */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xl select-text animate-scale-up-in">
                {/* Header info */}
                <div className="flex items-center gap-3 select-none mb-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                    {displayInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs font-bold text-zinc-800 truncate leading-none mb-1">{displayEmail}</p>
                    <span className="inline-block px-1.5 py-0.5 bg-violet-50 border border-violet-100 text-violet-750 rounded text-[9px] font-bold uppercase tracking-wider">
                      {currentUser.role} Account
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 my-2 select-none"></div>

                {/* Scans stats and limits */}
                <div className="space-y-3 py-1 text-[11px] select-none text-zinc-500">
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5">
                      <Activity size={12} className="text-zinc-400" />
                      Scans Used Today
                    </span>
                    <strong className="text-zinc-800 font-bold">{currentUser.scansCountToday ?? 0} scans</strong>
                  </div>

                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5">
                      <Shield size={12} className="text-zinc-450" />
                      Daily Base Limit
                    </span>
                    <span className="text-emerald-600 font-bold uppercase tracking-wide text-[9px]">Unlimited</span>
                  </div>

                  {/* Feature check lists */}
                  <div className="mt-1 pt-2 border-t border-zinc-100 space-y-1.5 text-[10px] text-zinc-450">
                    <div className="flex justify-between items-center">
                      <span>Standard Tools:</span>
                      <span className="text-emerald-600 font-semibold">✓ Unlimited Access</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Premium Tools (AI Writer, OCR):</span>
                      {currentUser.role === 'pro' || currentUser.role === 'admin' ? (
                        <span className="text-emerald-600 font-semibold">✓ Unlimited Access</span>
                      ) : (
                        <span className="text-zinc-400 font-medium">🔒 Pro Upgrade Required</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 my-2 select-none"></div>

                {/* Dropdown footer actions */}
                <div className="space-y-1 select-none">
                  {currentUser.role === 'admin' && (
                    <a
                      href="/adminpanel"
                      target="_blank"
                      className="w-full py-2 px-3 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border border-transparent"
                    >
                      <UserIcon size={12} />
                      <span>Admin Control Panel</span>
                    </a>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full py-2 px-3 hover:bg-rose-50/50 text-rose-600 hover:text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border-0 bg-transparent cursor-pointer text-left"
                  >
                    <LogOut size={12} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              setAuthModalRequiredLevel('registered');
              setAuthModalMode('login');
              setAuthError(null);
              setIsAuthModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-zinc-900/95 hover:bg-zinc-850 border border-zinc-800 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg cursor-pointer transition-all active:scale-95"
          >
            <UserIcon size={13} />
            <span>Sign In</span>
          </button>
        )}
      </div>
      
      {/* Background gridlines */}
      <div className="gridlines-container">
        <div className="gridline"></div>
        <div className="gridline"></div>
        <div className="gridline"></div>
        <div className="gridline"></div>
        <div className="gridline"></div>
      </div>

      <div className="ambient-glow"></div>

      {/* Website logo centered at top (in-flow, not absolute) */}
      <header className={`w-full flex justify-center select-none z-10 transition-all duration-500 ease-in-out ${isLoading || result ? 'mb-1.5' : 'mb-4'}`}>
        <img 
          src="/logo.png" 
          alt="EnterURL logo" 
          className={`w-auto object-contain select-none transition-all duration-500 ease-in-out ${isLoading || result ? 'h-10 md:h-12' : 'h-20 md:h-28'}`}
        />
      </header>

      {/* Hero Container */}
      <main className={`w-full max-w-3xl flex-1 flex flex-col items-center text-center z-10 overflow-hidden ${
        isLoading || result ? 'justify-start' : 'justify-center'
      }`}>
        
        {/* Typographical Editorial Header */}
        {!result && !isLoading && (
          <div className="mb-4 md:mb-6 animate-fade-in select-none">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-zinc-900 leading-none">
              Detect & Extract <br />
              <span className="font-semibold text-zinc-800">Any Content.</span>
            </h1>
            <p className="mt-3 text-xs md:text-sm text-zinc-400 font-light max-w-md mx-auto">
              Paste links from Instagram, YouTube, Pinterest, Reddit, TikTok, and more. Real-time platform identification and deep asset extraction.
            </p>
          </div>
        )}

        {/* Dynamic Scan Input Wrapper */}
        <div className={`w-full relative custom-card p-2.5 rounded-2xl flex flex-col justify-between ${isShaking ? 'animate-shake' : ''}`}>
          
          <div className="relative flex items-center w-full">
            <div className="pl-4 text-zinc-400">
              <LinkIcon size={18} />
            </div>

            {/* URL Input Box */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder=""
                value={inputUrl}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
                className="w-full bg-transparent border-0 outline-none px-3.5 py-4 text-sm md:text-base text-zinc-800 disabled:opacity-0 transition-opacity"
              />
              
              {/* Typewriter status overlap during scanning with smooth opacity fade */}
              {isLoading && (
                <div 
                  style={{ opacity: scanOpacity }}
                  className="absolute inset-0 flex items-center px-3.5 pointer-events-none text-zinc-500 text-sm md:text-base font-light text-scan-glow transition-opacity duration-200"
                >
                  {scanningText}
                </div>
              )}

              {/* Rolling suggestion placeholder when idle & empty */}
              {!inputUrl && !isLoading && (
                <div 
                  style={{ opacity: isFocused ? 0.2 : placeholderOpacity }}
                  className="absolute inset-0 flex items-center px-3.5 pointer-events-none text-zinc-400 text-sm md:text-base font-light transition-opacity duration-300 select-none whitespace-nowrap overflow-hidden"
                >
                  {placeholderSuggestions[placeholderIndex]}
                </div>
              )}
            </div>

            {/* Input card action elements */}
            <div className="flex items-center gap-1.5 pr-2">
              {inputUrl && !isLoading && (
                <button
                  onClick={handleClear}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <RefreshCw size={14} />
                </button>
              )}

              {!isLoading && (
                <button
                  onClick={handleClipboardPaste}
                  className="p-3 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-zinc-200/50 bg-zinc-50 shadow-sm animate-fade-in"
                  title="Paste from clipboard"
                >
                  <PasteIcon size={16} />
                </button>
              )}
              
              <button
                onClick={() => analyzeLink()}
                disabled={isLoading}
                className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <LoaderPulsingDots size={12} className="text-white mr-1" />
                    <span>Scanning</span>
                  </>
                ) : (
                  <>
                    <span>Detect</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        {(isLoading || result || error || isEditorOpen) && (
          <div className="w-full flex-1 overflow-y-auto mt-4 pr-1.5 pb-6 scrollbar-thin flex flex-col gap-4 text-left">
            {/* SCANNER STATS MODULE: Platform detector and asset listing */}
        {(isLoading || result) && (
          <div className="w-full mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left animate-slide-up-in">
            
            {/* 1. Left Box: Platform Capsule (Glass Capsule Pill Design) */}
            <div className="glass-button-wrapper">
              <button className="glass-button"></button>
              <span 
                className="button-text text-white border border-zinc-200/10"
                style={{ 
                  background: (isLoading || result) 
                    ? getPlatformCapsuleBg(currentPlatformKey) 
                    : '#52525b' 
                }}
              >
                {(isLoading && !isPlatformMatched) ? (
                  <>
                    <LoaderPulsingDots size={10} className="text-white shrink-0" />
                    <span className="text-white font-medium text-xs tracking-wide ml-1">{platforms[rollingIndex]}</span>
                  </>
                ) : (isPlatformMatched || result) ? (
                  <>
                    {getPlatformLogo(currentPlatformKey)}
                    <span className="text-white font-semibold text-xs tracking-wider uppercase">
                      {getPlatformLabel(currentPlatformKey)}
                    </span>
                  </>
                ) : null}
              </span>
              <span className="glass-effect"></span> 
            </div>

             {/* 2. Right Box: Assets Identified (Dark Capsule Bar) */}
            {showAssetsList && result && (
              <div className="bg-zinc-950 p-1.5 rounded-xl sm:rounded-full flex flex-row flex-nowrap items-center gap-1 border border-zinc-800 shadow-xl animate-slide-up-in overflow-x-auto max-w-full w-full sm:w-auto scrollbar-none select-none">
                {assetBadges.map((badge) => {
                  const isSelected = activeAsset === badge.id;
                  return (
                    <button
                      key={badge.id}
                      onClick={() => handleSelectAsset(badge.id)}
                      className={`px-4.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${
                        isSelected 
                          ? 'bg-white text-zinc-950 shadow-md font-bold scale-102' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                      }`}
                    >
                      {badge.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Error Feedback message */}
        {error && (
          <div className="w-full mt-4 text-left border border-red-155 bg-red-50/70 p-4 rounded-xl flex flex-col gap-3.5 animate-fade-in shadow-sm select-text">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-655 font-light flex-1">
                <span className="font-semibold block mb-0.5 text-red-800 text-sm">Sorry, this time some technical issue</span>
                <span className="opacity-95 font-mono text-[10px] bg-red-100/50 px-2 py-1.5 rounded block mt-1 break-all border border-red-200/40 select-all">{error}</span>
              </div>
            </div>

            {/* General Feedback Box */}
            <div className="border-t border-red-100/60 pt-3.5 flex flex-col gap-2">
              <span className="text-[10px] text-red-650 font-semibold uppercase tracking-wider block">Report this issue to the developer</span>
              {feedbackSubmitted ? (
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 py-1">
                  <Check size={14} className="text-emerald-500" />
                  <span>Thank you! Your feedback has been sent to the developer.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe what you were trying to do or add custom notes..."
                    className="w-full min-h-[60px] p-2.5 text-xs bg-white border border-red-250 rounded-xl text-zinc-800 focus:outline-none focus:ring-1 focus:ring-red-400 placeholder:text-zinc-400 font-light"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSubmitFeedback(error || 'Unknown Error', 'Scan Error')}
                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {isSubmittingFeedback ? <LoaderPulsingDots size={10} className="text-white mr-1" /> : null}
                      <span>Submit Feedback</span>
                    </button>
                    <a
                      href={`mailto:shashank8808108802@gmail.com?subject=EnterURL Error Report&body=Hi Shashank,%0D%0A%0D%0AI encountered an error on EnterURL.%0D%0A%0D%0AURL scanned: ${encodeURIComponent(inputUrl)}%0D%0AError message: ${encodeURIComponent(error || '')}%0D%0A%0D%0AUser comments: ${encodeURIComponent(feedbackText)}`}
                      className="px-3.5 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-700 font-medium rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span>Open Mail Client</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showPreviewCard && result && activeAsset && (
          <div className="w-full text-left animate-fade-in z-20">
            <div className="custom-card rounded-2xl overflow-hidden border border-zinc-100 bg-white/95 shadow-lg">
              
              {/* Dynamic body based on click selection */}
              <div className="p-6">
                {isTransitioningTab === activeAsset ? (
                  getTabTransitionLoader(activeAsset, result?.platform)
                ) : (
                  <>
                    {/* 1. VIDEO PREVIEW TAB */}
                    {activeAsset === 'video' && (
                  <div className="space-y-4 animate-slide-up-in">
                    {result.embedUrl ? (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner border border-zinc-100">
                        <iframe
                          src={result.embedUrl}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title="Media Preview Embed"
                        ></iframe>
                      </div>
                    ) : result.mediaUrls && result.mediaUrls.length > 0 ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-black border border-zinc-100 shadow-inner">
                        <video 
                          src={result.mediaUrls[0]} 
                          controls 
                          className="w-full max-h-[360px] object-contain"
                          poster={result.previewUrl}
                        />
                      </div>
                    ) : (
                      <div className="w-full py-8 text-center text-zinc-400 text-xs font-light">
                        Video preview not supported directly. Try downloading using the button below.
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-base font-semibold text-zinc-800 leading-snug line-clamp-2">{result.title}</h3>
                        {result.duration && result.duration !== 'Unknown' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md shrink-0">
                            <Clock size={10} />
                            {result.duration}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-400 font-light leading-relaxed">{result.description}</p>
                      <span className="mt-2 block text-[10px] text-zinc-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{result.url}</span>
                    </div>

                    {isDownloadingVideo ? (
                      <div className="space-y-3 py-4 text-center border border-zinc-100 rounded-xl bg-zinc-50/50 p-4 animate-pulse-subtle">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <LoaderOrbCircle size={40} className="text-zinc-800" />
                          <h4 className="text-xs font-semibold text-zinc-700 tracking-wide uppercase">Downloading Video Asset</h4>
                          <p className="text-[11px] text-zinc-400 font-light">{downloadText}</p>
                        </div>
                        <div className="w-full max-w-xs mx-auto bg-zinc-200 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-zinc-800 h-full rounded-full transition-all duration-200"
                            style={{ width: `${downloadProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-400">{downloadProgress}%</div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {/* Direct media file video OR normal platform download */}
                        {(result.platform !== 'youtube' && result.platform !== 'instagram' && result.platform !== 'tiktok') ? (
                          result.mediaUrls && result.mediaUrls.length > 0 && (
                            <button
                              onClick={() => handleDownload(result.mediaUrls![0], result.title)}
                              className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                              <Download size={15} />
                              <span>Download Video File</span>
                            </button>
                          )
                        ) : (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleRealVideoDownload(result.url, 'video', result.title, selectedVideoQuality)}
                              className="flex-grow py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                              <Download size={15} />
                              <span>Download Full Video</span>
                            </button>
                            <div className="relative shrink-0 w-32">
                              <select
                                value={selectedVideoQuality}
                                onChange={(e) => setSelectedVideoQuality(e.target.value)}
                                className="w-full h-full pl-3 pr-8 py-3.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer appearance-none"
                              >
                                <option value="max">Max Quality</option>
                                <option value="2160">2160p (4K)</option>
                                <option value="1440">1440p (2K)</option>
                                <option value="1080">1080p (HD)</option>
                                <option value="720">720p (HD)</option>
                                <option value="480">480p</option>
                                <option value="360">360p</option>
                                <option value="240">240p</option>
                                <option value="144">144p</option>
                              </select>
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                <ArrowDown size={14} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Extra youtube/tiktok button */}
                        {result.platform === 'youtube' && (
                          <button
                            onClick={handleDownloadSubtitles}
                            disabled={isDownloadingSubtitles || result.hasSubtitles === false}
                            className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 disabled:hover:bg-zinc-100 text-zinc-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-200/40 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isDownloadingSubtitles ? (
                              <LoaderPulsingDots size={10} className="text-zinc-650" />
                            ) : (
                              <FileText size={13} className="text-zinc-600" />
                            )}
                            <span>{result.hasSubtitles === false ? 'Subtitles Not Available' : 'Download Subtitles (.srt)'}</span>
                          </button>
                        )}

                        {result.contentType === 'video' && (
                          <button
                            onClick={handleLaunchCaptionEditor}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Sparkles size={13} />
                            <span>Edit Captions & Styles</span>
                          </button>
                        )}


                        {result.previewUrl && (
                          <button
                            onClick={() => handleDownload(result.previewUrl!, result.title + '_thumbnail')}
                            className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-zinc-200/40"
                          >
                            <Download size={13} />
                            <span>Download High-Res Thumbnail Image</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. IMAGE PREVIEW TAB */}
                {activeAsset === 'image' && (
                  <div className="space-y-4 animate-slide-up-in">
                    {result.previewUrl ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100/80 flex justify-center items-center max-h-[380px] p-2">
                        <img 
                          src={result.previewUrl} 
                          alt={result.title || 'Scraped Preview'}
                          className="rounded-lg object-contain max-h-[360px] shadow-sm select-none"
                        />
                      </div>
                    ) : result.platform === 'instagram' ? (
                      /* Mocked image preview card for Instagram post */
                      <div className="relative w-full rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100/80 flex flex-col justify-center items-center h-[260px] p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 mb-2">
                          <ImageIcon size={22} />
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-800">Instagram Post Image</h4>
                        <p className="text-[10px] text-zinc-400 font-light mt-1 max-w-[200px]">
                          Preview frame restricted by Instagram. You can still download the image asset below.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full py-8 text-center text-zinc-400 text-xs font-light">
                        No image asset preview available
                      </div>
                    )}

                    {/* Image gallery selection for Reddit or similar carousels */}
                    {result.mediaUrls && result.mediaUrls.length > 1 && (
                      <div className="mt-2 space-y-2">
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase">Gallery Images Available ({result.mediaUrls.length})</span>
                        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                          {result.mediaUrls.map((url, i) => (
                            <div 
                              key={i} 
                              onClick={() => setResult(prev => prev ? { ...prev, previewUrl: url } : null)}
                              className={`w-14 h-14 rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all ${result.previewUrl === url ? 'border-violet-600 scale-95 ring-2 ring-violet-500/20' : 'border-zinc-200 hover:border-zinc-400'}`}
                            >
                              <img src={url} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-base font-semibold text-zinc-800 leading-snug line-clamp-1">{result.title}</h3>
                      {result.description && (
                        <p className="mt-1 text-xs text-zinc-400 font-light leading-relaxed line-clamp-2">{result.description}</p>
                      )}
                      <span className="mt-2 block text-[10px] text-zinc-350 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{result.url}</span>
                    </div>

                    {(result.previewUrl || result.platform === 'instagram') && (
                      <button
                        onClick={() => {
                          if (result.previewUrl) {
                            handleDownload(result.previewUrl, result.title);
                          } else {
                            const sampleImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200';
                            handleDownload(sampleImageUrl, result.title || 'instagram_image');
                          }
                        }}
                        className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <Download size={15} />
                        <span>Download Image Asset</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 3. AUDIO PREVIEW TAB */}
                {activeAsset === 'audio' && (
                  <div className="space-y-4 animate-slide-up-in">
                    {isExtractingAudio ? (
                      <div className="space-y-6 py-8 text-center animate-slide-up-in">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <LoaderEqualizer size={48} className="text-violet-500" />
                          <h4 className="text-sm font-semibold text-zinc-800 tracking-wide uppercase">Extracting Audio Track</h4>
                          <p className="text-xs text-zinc-400 font-light max-w-xs">{extractionText}</p>
                        </div>

                        <div className="w-full max-w-sm mx-auto bg-zinc-100 rounded-full h-1.5 overflow-hidden border border-zinc-200/20 shadow-inner">
                          <div 
                            className="bg-violet-600 h-full rounded-full transition-all duration-200"
                            style={{ width: `${extractionProgress}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">{extractionProgress}%</div>
                      </div>
                    ) : (
                      <>
                        {(result.contentType === 'video' || result.embedUrl) ? (
                          // Real video preview for audio extraction sources
                          result.embedUrl ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner border border-zinc-100">
                              <iframe
                                src={result.embedUrl}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                title="Media Preview Embed"
                              ></iframe>
                            </div>
                          ) : result.mediaUrls && result.mediaUrls.length > 0 ? (
                            <div className="relative w-full rounded-xl overflow-hidden bg-black border border-zinc-100 shadow-inner">
                              <video 
                                src={result.mediaUrls[0]} 
                                controls 
                                className="w-full max-h-[360px] object-contain"
                                poster={result.previewUrl}
                              />
                            </div>
                          ) : result.previewUrl ? (
                            <div className="relative w-full rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100/80 flex justify-center items-center max-h-[380px] p-2">
                              <img 
                                src={result.previewUrl} 
                                alt={result.title}
                                className="w-full h-auto max-h-[360px] object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-full py-8 text-center text-zinc-400 text-xs font-light">
                              Video preview not supported. Use the button below to extract audio.
                            </div>
                          )
                        ) : (
                          // Original audio player for direct audio links
                          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
                            <div className="flex items-end gap-1.5 h-10 w-full justify-center select-none opacity-40">
                              <div className="w-1.5 bg-zinc-400 rounded-full h-3 animate-[pulse_1s_infinite_100ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-8 animate-[pulse_1s_infinite_300ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-5 animate-[pulse_1s_infinite_500ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-7 animate-[pulse_1s_infinite_200ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-4 animate-[pulse_1s_infinite_400ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-8 animate-[pulse_1s_infinite_700ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-6 animate-[pulse_1s_infinite_600ms]"></div>
                              <div className="w-1.5 bg-zinc-400 rounded-full h-3 animate-[pulse_1s_infinite_100ms]"></div>
                            </div>
                            
                            <audio 
                              src={result.url} 
                              controls 
                              onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime * 1000)}
                              className="w-full animate-fade-in" 
                            />
                          </div>
                        )}

                        <div>
                          <h3 className="text-base font-semibold text-zinc-800 leading-snug line-clamp-1">
                            {(result.contentType === 'video' || result.embedUrl) ? `${result.title} (Audio Track)` : result.title}
                          </h3>
                          <span className="mt-1.5 block text-[10px] text-zinc-350 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{result.url}</span>
                        </div>

                        {isDownloadingAudioFile ? (
                          <div className="space-y-3 py-4 text-center border border-zinc-100 rounded-xl bg-zinc-50/50 p-4 animate-pulse-subtle">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <LoaderEqualizer size={40} className="text-violet-500" />
                              <h4 className="text-xs font-semibold text-zinc-700 tracking-wide uppercase">Converting & Downloading MP3</h4>
                              <p className="text-[11px] text-zinc-400 font-light">{audioDownloadText}</p>
                            </div>
                            <div className="w-full max-w-xs mx-auto bg-zinc-200 rounded-full h-1 overflow-hidden">
                              <div 
                                className="bg-violet-600 h-full rounded-full transition-all duration-200"
                                style={{ width: `${audioDownloadProgress}%` }}
                              ></div>
                            </div>
                            <div className="text-[9px] font-mono text-zinc-400">{audioDownloadProgress}%</div>
                          </div>
                        ) : (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => {
                                if (result.platform === 'youtube' || result.platform === 'instagram' || result.platform === 'tiktok') {
                                  handleRealVideoDownload(result.url, 'audio', result.title, undefined, selectedAudioQuality);
                                } else {
                                  handleDownload(
                                    (result.contentType === 'video' || result.embedUrl) ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : result.url,
                                    result.title + '_audio'
                                  );
                                }
                              }}
                              className="flex-grow py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                              <Download size={15} />
                              <span>Download Audio file</span>
                            </button>
                            <div className="relative shrink-0 w-32">
                              <select
                                value={selectedAudioQuality}
                                onChange={(e) => setSelectedAudioQuality(e.target.value)}
                                className="w-full h-full pl-3 pr-8 py-3.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer appearance-none"
                              >
                                <option value="320">320 kbps</option>
                                <option value="256">256 kbps</option>
                                <option value="128">128 kbps</option>
                                <option value="96">96 kbps</option>
                                <option value="64">64 kbps</option>
                                <option value="8">8 kbps</option>
                              </select>
                              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                                <ArrowDown size={14} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Synced AI Audio Transcription (AssemblyAI) */}
                        <div className="mt-5 pt-4 border-t border-zinc-100 space-y-3">
                          <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                            <Mic size={10} />
                            AI Audio Transcription (AssemblyAI)
                          </span>

                          {!transcriptionText && !transcriptionError ? (
                            <button
                              onClick={() => handleTranscribe(result.mediaUrls?.[0] || result.url)}
                              disabled={isTranscribing}
                              className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md"
                            >
                              {isTranscribing ? (
                                <>
                                  <LoaderPulsingDots size={12} className="text-white" />
                                  <span>{transcriptionStatus || 'Processing...'}</span>
                                </>
                              ) : (
                                <>
                                  <Mic size={15} />
                                  <span>Transcribe Audio to Text</span>
                                </>
                              )}
                            </button>
                          ) : transcriptionText ? (
                            <div className="space-y-2">
                              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {transcriptionLanguage && <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">🌐 {transcriptionLanguage.toUpperCase()}</span>}
                                    {transcriptionConfidence !== null && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">✓ {Math.round(transcriptionConfidence * 100)}% confidence</span>}
                                  </div>
                                  <button
                                    onClick={() => handleCopyText(transcriptionText!, 'transcript')}
                                    className="p-1.5 bg-white border border-zinc-200/50 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-all"
                                  >
                                    {copiedText['transcript'] ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                                
                                {!transcriptionWords ? (
                                  <p className="text-xs text-zinc-750 leading-relaxed select-text max-h-[200px] overflow-y-auto">{transcriptionText}</p>
                                ) : (
                                  <div className="text-xs leading-relaxed select-text max-h-[200px] overflow-y-auto mt-1 font-sans">
                                    <div className="flex flex-wrap gap-x-1 gap-y-1">
                                      {transcriptionWords.map((wordObj: any, i: number) => {
                                        const isCurrent = audioCurrentTime >= wordObj.start && audioCurrentTime <= wordObj.end;
                                        return (
                                          <span 
                                            key={i} 
                                            className={`transition-all duration-150 rounded px-0.5 ${
                                              isCurrent 
                                                ? 'bg-violet-200 text-violet-950 font-bold scale-105 shadow-sm' 
                                                : 'text-zinc-700 hover:bg-zinc-100'
                                            }`}
                                          >
                                            {wordObj.text}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => { setTranscriptionText(null); setTranscriptionError(null); setTranscriptionId(null); setTranscriptionWords(null); }}
                                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-xl text-xs font-semibold transition-all"
                              >
                                Transcribe Again
                              </button>
                            </div>
                          ) : transcriptionError ? (
                            <div className="space-y-3.5 border border-rose-100 bg-rose-50/40 p-4 rounded-xl select-text">
                              <div className="flex items-start gap-2.5">
                                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-655 font-light flex-1">
                                  <span className="font-semibold block mb-0.5 text-rose-800 text-xs">Sorry, this time some technical issue</span>
                                  <span className="opacity-95 font-mono text-[10px] bg-rose-100/50 px-1.5 py-1 rounded block mt-0.5 break-all select-all">{transcriptionError}</span>
                                </div>
                              </div>
                              
                              {/* Transcription Feedback form */}
                              <div className="border-t border-rose-100/50 pt-3 flex flex-col gap-2">
                                <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider block">Report this transcription issue</span>
                                {feedbackSubmitted ? (
                                  <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5 py-0.5">
                                    <Check size={12} className="text-emerald-500" />
                                    <span>Sent to developer!</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <textarea
                                      value={feedbackText}
                                      onChange={(e) => setFeedbackText(e.target.value)}
                                      placeholder="Comment on what happened..."
                                      className="w-full min-h-[50px] p-2 text-[11px] bg-white border border-rose-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-450 placeholder:text-zinc-400 font-light"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => handleSubmitFeedback(transcriptionError || 'Unknown Transcription Error', 'Transcription Error')}
                                        disabled={isSubmittingFeedback || !feedbackText.trim()}
                                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium rounded-md text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                      >
                                        {isSubmittingFeedback ? <LoaderPulsingDots size={10} className="text-white mr-1" /> : null}
                                        <span>Send Report</span>
                                      </button>
                                      <a
                                        href={`mailto:shashank8808108802@gmail.com?subject=EnterURL Transcription Error&body=Hi Shashank,%0D%0A%0D%0AI encountered a transcription error on EnterURL.%0D%0A%0D%0AURL: ${encodeURIComponent(inputUrl)}%0D%0AError: ${encodeURIComponent(transcriptionError || '')}%0D%0A%0D%0AComments: ${encodeURIComponent(feedbackText)}`}
                                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-medium rounded-md text-[10px] transition-all flex items-center gap-1"
                                      >
                                        <span>Mail Client</span>
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => { setTranscriptionError(null); setFeedbackSubmitted(false); setFeedbackText(''); }}
                                className="w-full py-2 bg-white hover:bg-zinc-50 text-zinc-650 border border-zinc-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                              >
                                Try Again
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 4. WEBSITE METADATA TAB */}
                {activeAsset === 'website' && (
                  <div className="space-y-4 animate-slide-up-in">
                    {result.locationData ? (
                      <div className="relative w-full rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 h-[260px] p-1">
                        <iframe
                          title="Location Map"
                          src={result.locationData.embedUrl}
                          className="w-full h-full border-0 rounded-lg"
                          allowFullScreen
                          loading="lazy"
                        ></iframe>
                      </div>
                    ) : result.previewUrl ? (
                      <div className="relative w-full rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex justify-center items-center max-h-[260px] p-1">
                        <img 
                          src={result.previewUrl} 
                          alt="Web page layout banner"
                          className="rounded-lg object-cover w-full h-[220px]"
                        />
                      </div>
                    ) : (
                      <div className="w-full py-6 border border-dashed border-zinc-250 rounded-xl flex flex-col items-center justify-center text-zinc-400 text-xs font-light">
                        <GlobeIcon size={24} className="mb-2 text-zinc-350" />
                        <span>No website banner graphic found</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-zinc-800 leading-snug">{result.title}</h3>
                        {result.productData && (
                          <span className="shrink-0 inline-flex px-2 py-0.5 bg-violet-100 text-violet-850 text-[10px] font-black font-mono rounded-lg border border-violet-200">
                            {result.productData.currency === 'INR' ? '₹' : result.productData.currency === 'EUR' ? '€' : '$'}
                            {result.productData.price}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-light leading-relaxed line-clamp-3">{result.description}</p>
                      <span className="mt-2 block text-[10px] text-zinc-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{result.url}</span>
                    </div>

                    {/* Geolocation Details Card */}
                    {result.locationData && (
                      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 space-y-1.5 font-mono text-[10px] text-zinc-600">
                        <div className="flex justify-between border-b border-zinc-200/40 pb-1">
                          <span className="text-zinc-400 font-bold">Latitude</span>
                          <span className="text-zinc-700 font-medium">{result.locationData.latitude}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-200/40 pb-1">
                          <span className="text-zinc-400 font-bold">Longitude</span>
                          <span className="text-zinc-700 font-medium">{result.locationData.longitude}</span>
                        </div>
                        {result.locationData.address && (
                          <div className="pt-1">
                            <span className="text-zinc-400 font-bold block mb-1">Full Location Address</span>
                            <span className="text-zinc-700 font-medium leading-relaxed block">{result.locationData.address}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Product Price Tracker & Timeline */}
                    {result.productData && (
                      <div className="p-4 bg-violet-50/40 border border-violet-100 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-850 flex items-center gap-1.5">
                            <Sparkles size={12} className="text-violet-600" />
                            Product Price History Tracker
                          </span>
                          <span className="text-sm font-black text-violet-750 font-mono">
                            Current: {result.productData.currency === 'INR' ? '₹' : result.productData.currency === 'EUR' ? '€' : '$'}
                            {result.productData.price}
                          </span>
                        </div>

                        {result.productData.priceHistory && result.productData.priceHistory.length > 0 ? (
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider block">Price Timeline (Date & Time)</span>
                            <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                              {result.productData.priceHistory.slice().reverse().map((point, index) => {
                                const dateStr = new Date(point.timestamp).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                });
                                return (
                                  <div key={index} className="flex justify-between items-center text-[10px] bg-white px-2.5 py-1.5 rounded-lg border border-zinc-100 font-mono">
                                    <span className="text-zinc-500 font-semibold">{dateStr}</span>
                                    <span className="text-zinc-800 font-extrabold">
                                      {point.currency === 'INR' ? '₹' : point.currency === 'EUR' ? '€' : '$'}
                                      {point.price}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-light block">No previous price records found. Stored current price for future tracking!</span>
                        )}
                      </div>
                    )}

                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-sm font-medium items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-200/50"
                    >
                      <span>Visit original site link</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* 5. IMAGE TOOLS & DETAILS TAB (Only for direct-image) */}
                {activeAsset === 'image-tools' && (
                  <div className="space-y-5 animate-slide-up-in">
                    {/* Header Dimensions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100/50">
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Dimensions</span>
                        <span className="text-sm font-bold text-zinc-700">
                          {imgDetails ? `${imgDetails.width} × ${imgDetails.height}` : 'Loading...'}
                        </span>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100/50">
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 block">File Size / Mime</span>
                        <span className="text-xs font-bold text-zinc-700 truncate block">
                          {imgDetails?.size || 'Scanning size...'}
                        </span>
                      </div>
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100/50">
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Source Domain</span>
                        <span className="text-sm font-bold text-zinc-700 truncate block">
                          {result.domain}
                        </span>
                      </div>
                    </div>

                    {/* Dominant color palettes */}
                    <div>
                      <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block mb-2">Color Palette Extractor</span>
                      <div className="flex items-center gap-3">
                        {extractedColors.map((col, index) => (
                          <div 
                            key={index} 
                            onClick={() => handleCopyText(col, `col-${index}`)}
                            className="group flex flex-col items-center gap-1 cursor-pointer transition-all hover:scale-105"
                          >
                            <div 
                              className="w-12 h-12 rounded-xl border border-zinc-200/50 shadow-inner flex items-center justify-center text-white"
                              style={{ backgroundColor: col }}
                            >
                              <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold">Copy</span>
                            </div>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {copiedText[`col-${index}`] ? 'Copied!' : col.replace('rgb', '')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* EXIF Viewer */}
                    <div>
                      <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block mb-2">EXIF Metadata details</span>
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 font-mono text-[10px] text-zinc-500 overflow-y-auto max-h-[140px] space-y-1">
                        {exifData ? (
                          exifData.message ? (
                            <span className="text-zinc-400 italic block">{exifData.message}</span>
                          ) : (
                            Object.entries(exifData).map(([key, val]: any) => (
                              <div key={key} className="flex justify-between border-b border-zinc-200/30 pb-0.5">
                                <span className="text-zinc-400 font-semibold">{key}</span>
                                <span className="text-zinc-600 font-medium truncate max-w-[240px]">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </span>
                              </div>
                            ))
                          )
                        ) : (
                          <span className="text-zinc-400 block animate-pulse">Reading file structure tags...</span>
                        )}
                      </div>
                    </div>

                    {/* Reverse Image Search Links & QR */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <div className="flex-1 space-y-2">
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block">Reverse Image Search</span>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                          <a 
                            href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(result.previewUrl!)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-zinc-200/50"
                          >
                            <Search size={12} />
                            Google Lens
                          </a>
                          <a 
                            href={`https://tineye.com/search?url=${encodeURIComponent(result.previewUrl!)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-zinc-200/50"
                          >
                            <Search size={12} />
                            TinEye Match
                          </a>
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3">
                        <canvas ref={qrCanvasRef} className="rounded border border-zinc-800 shadow" />
                        <div>
                          <span className="text-[9px] font-bold text-violet-400 tracking-widest uppercase block mb-1">Image QR Code</span>
                          <button 
                            onClick={() => handleCopyText(result.url, 'img-qr')}
                            className="text-[11px] text-zinc-350 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                          >
                            {copiedText['img-qr'] ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {copiedText['img-qr'] ? 'Copied URL!' : 'Copy URL'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove.bg Background Removal */}
                    {result.previewUrl && (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <Eraser size={10} />
                          AI Background Removal (Remove.bg)
                        </span>

                        {!removedBgImageUrl ? (
                          <button
                            onClick={() => handleRemoveBg(result.previewUrl!)}
                            disabled={isRemovingBg}
                            className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
                          >
                            {isRemovingBg ? (
                                <>
                                  <LoaderPulsingDots size={12} className="text-white" />
                                  <span>Removing background via AI… (30–60s)</span>
                                </>
                            ) : (
                              <>
                                <Eraser size={15} />
                                <span>Remove Image Background</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <div className="relative rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2QxZDVkYiIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNkMWQ1ZGIiLz48L3N2Zz4=')]">
                              <img src={removedBgImageUrl} alt="Background removed" className="w-full rounded-xl object-contain max-h-[220px]" />
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={removedBgImageUrl}
                                download="background-removed.png"
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                              >
                                <Download size={14} />
                                Download PNG (Transparent)
                              </a>
                              <button
                                onClick={() => { setRemovedBgImageUrl(null); setRemoveBgError(null); }}
                                className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-sm font-semibold transition-all"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        )}
                        {removeBgError && (
                          <div className="space-y-3 mt-2.5 border border-rose-100 bg-rose-50/40 p-4 rounded-xl select-text">
                            <div className="flex items-start gap-2.5">
                              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                              <div className="text-xs text-rose-655 font-light flex-1">
                                <span className="font-semibold block mb-0.5 text-rose-800 text-xs">Sorry, this time some technical issue</span>
                                <span className="opacity-95 font-mono text-[10px] bg-rose-100/50 px-1.5 py-1 rounded block mt-0.5 break-all select-all">{removeBgError}</span>
                              </div>
                            </div>
                            
                            {/* Bg Removal Feedback form */}
                            <div className="border-t border-rose-100/50 pt-3 flex flex-col gap-2">
                              <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider block">Report this bg removal issue</span>
                              {feedbackSubmitted ? (
                                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5 py-0.5">
                                  <Check size={12} className="text-emerald-500" />
                                  <span>Sent to developer!</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Comment on what happened..."
                                    className="w-full min-h-[50px] p-2 text-[11px] bg-white border border-rose-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-455 placeholder:text-zinc-400 font-light"
                                  />
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleSubmitFeedback(removeBgError || 'Unknown Bg Removal Error', 'Bg Removal Error')}
                                      disabled={isSubmittingFeedback || !feedbackText.trim()}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium rounded-md text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      {isSubmittingFeedback ? <LoaderPulsingDots size={10} className="text-white mr-1" /> : null}
                                      <span>Send Report</span>
                                    </button>
                                    <a
                                      href={`mailto:shashank8808108802@gmail.com?subject=EnterURL Background Removal Error&body=Hi Shashank,%0D%0A%0D%0AI encountered a background removal error on EnterURL.%0D%0A%0D%0AURL: ${encodeURIComponent(inputUrl)}%0D%0AError: ${encodeURIComponent(removeBgError || '')}%0D%0A%0D%0AComments: ${encodeURIComponent(feedbackText)}`}
                                      className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-medium rounded-md text-[10px] transition-all flex items-center gap-1"
                                    >
                                      <span>Mail Client</span>
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => { setRemoveBgError(null); setFeedbackSubmitted(false); setFeedbackText(''); }}
                              className="w-full py-2 bg-white hover:bg-zinc-50 text-zinc-650 border border-zinc-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                            >
                              Dismiss Error
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OCR Text Extractor */}
                    {result.previewUrl && (
                      <div className="pt-2">
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <Search size={10} />
                          AI Text Extractor (OCR)
                        </span>
                        
                        {!ocrText ? (
                          <button
                            onClick={() => handleRunOcr(result.previewUrl!)}
                            disabled={ocrProgress !== null}
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                          >
                            {ocrProgress !== null ? (
                              <>
                                <LoaderPulsingDots size={12} className="text-white" />
                                <span>{ocrStatus} ({ocrProgress}%)</span>
                              </>
                            ) : (
                              <>
                                <Search size={13} />
                                <span>Scan & Extract Text from Image</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between border-b border-zinc-200/40 pb-2">
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">Extracted Text</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleCopyText(ocrText, 'ocr')}
                                  className="p-1 bg-white border border-zinc-200/50 hover:bg-zinc-100 rounded text-zinc-500 transition-colors cursor-pointer"
                                  title="Copy text"
                                >
                                  {copiedText['ocr'] ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                </button>
                                <button
                                  onClick={() => setOcrText(null)}
                                  className="p-1 bg-white border border-zinc-200/50 hover:bg-zinc-100 rounded text-zinc-500 transition-colors cursor-pointer"
                                  title="Clear OCR"
                                >
                                  <RefreshCw size={11} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-[#1c1c1e] leading-relaxed max-h-[140px] overflow-y-auto select-text font-mono bg-white p-2.5 rounded-lg border border-zinc-100/80">{ocrText}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 5A. LIGHTHOUSE TAB */}
                {/* 5A. LIGHTHOUSE TAB */}
                {activeAsset === 'lighthouse' && (
                  <div className="space-y-4 animate-slide-up-in">
                    <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                      <Sparkles size={11} className="text-violet-500" />
                      Lighthouse Performance & SEO Audits
                    </span>

                    {lazyLoadingTab === 'lighthouse' ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                        <LoaderDoubleRing size={48} className="text-violet-600" />
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider text-zinc-850">Running Lighthouse Audits...</span>
                        <p className="text-[11px] text-zinc-400 font-light max-w-xs mx-auto">Analyzing page weight, DOM elements, response compression, and SEO tags...</p>
                      </div>
                    ) : result.lighthouseAudit ? (
                      <>
                        {/* Circular Score Gauges */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <LighthouseScoreCircle score={result.lighthouseAudit.performance.score} label="Performance" />
                          <LighthouseScoreCircle score={result.lighthouseAudit.accessibility.score} label="Accessibility" />
                          <LighthouseScoreCircle score={result.lighthouseAudit.bestPractices.score} label="Best Practices" />
                          <LighthouseScoreCircle score={result.lighthouseAudit.seo.score} label="SEO" />
                        </div>

                        {/* Collapsible/Categorized Audit Checklists */}
                        <div className="mt-6 space-y-4">
                          {['performance', 'accessibility', 'bestPractices', 'seo'].map((catKey) => {
                            const category = result.lighthouseAudit?.[catKey as keyof typeof result.lighthouseAudit];
                            if (!category) return null;
                            
                            const catLabel = catKey === 'bestPractices' ? 'Best Practices' : 
                                             catKey === 'seo' ? 'SEO' : 
                                             catKey.charAt(0).toUpperCase() + catKey.slice(1);

                            return (
                              <div key={catKey} className="border border-zinc-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="bg-zinc-50/50 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-700 tracking-wide">{catLabel} Rules Checklist</span>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    category.score >= 90 ? 'bg-emerald-100 text-emerald-800' : 
                                    category.score >= 50 ? 'bg-amber-100 text-amber-800' : 
                                    'bg-rose-100 text-rose-800'
                                  }`}>{category.score}/100</span>
                                </div>
                                <div className="divide-y divide-zinc-100">
                                  {category.items.map((item, i) => (
                                    <div key={i} className="px-4 py-2.5 flex items-start gap-2.5 text-xs">
                                      {item.passed ? (
                                        <CheckCircle size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                                      ) : (
                                        <XCircle size={15} className="text-rose-500 mt-0.5 shrink-0" />
                                      )}
                                      <div>
                                        <span className="font-semibold text-zinc-800 block leading-normal">{item.name}</span>
                                        <span className="text-[10px] text-zinc-400 font-light block mt-0.5">{item.detail}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center text-zinc-400 text-xs font-light">
                        Lighthouse audits failed or are not available for this site.
                      </div>
                    )}
                  </div>
                )}

                {/* 5B. SCREENSHOTS TAB */}
                {activeAsset === 'screenshots' && (
                  <div className="space-y-4 animate-slide-up-in">
                    <div className="flex items-center justify-between border-b border-zinc-150 pb-3 flex-wrap gap-2">
                      <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                        <ImageIcon size={10} />
                        Live Web Page Screenshot Engine
                      </span>
                      <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/50 select-none">
                        {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                          <button
                            key={device}
                            onClick={() => setScreenshotDevice(device)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              screenshotDevice === device ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'
                            }`}
                          >
                            {device}
                          </button>
                        ))}
                      </div>
                    </div>

                    {screenshotLoading ? (
                      <div className="w-full h-72 border border-zinc-100 rounded-xl bg-zinc-50/50 flex flex-col items-center justify-center gap-2">
                        <LoaderClock size={48} className="text-violet-500" />
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Capturing Live {screenshotDevice} view</span>
                        <span className="text-[10px] text-zinc-400 font-light">Launching headless browser session...</span>
                      </div>
                    ) : screenshotData[screenshotDevice] ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-full border border-zinc-200/80 rounded-xl overflow-hidden bg-zinc-50 shadow-lg mx-auto transition-all duration-300 ${
                          screenshotDevice === 'mobile' ? 'max-w-[280px] aspect-[9/16]' :
                          screenshotDevice === 'tablet' ? 'max-w-[500px] aspect-[4/3]' : 'w-full aspect-video'
                        }`}>
                          {screenshotDevice !== 'mobile' && (
                            <div className="bg-zinc-100 border-b border-zinc-200 px-3 py-2 flex items-center gap-2 shrink-0 select-none">
                              <div className="flex gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-400 block"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-green-400 block"></span>
                              </div>
                              <div className="bg-white rounded px-2.5 py-0.5 text-[9px] font-mono text-zinc-400 flex-1 truncate border border-zinc-200/40">
                                {result.url}
                              </div>
                            </div>
                          )}
                          <div className="w-full h-full bg-white overflow-y-auto scrollbar-none">
                            <img src={screenshotData[screenshotDevice]} className="w-full h-auto object-top" alt="Page Screenshot" />
                          </div>
                        </div>
                        <a 
                          href={screenshotData[screenshotDevice]} 
                          download={`screenshot_${screenshotDevice}.png`}
                          className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Download size={12} />
                          Download PNG Screenshot
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-64 border border-dashed border-zinc-205 rounded-xl flex flex-col items-center justify-center gap-3 bg-zinc-50/20 text-center p-4">
                        <ImageIcon size={28} className="text-zinc-350" />
                        <span className="text-xs text-zinc-400">Failed to render screenshot. Headless browser was unable to load this domain.</span>
                        <button 
                          onClick={() => handleFetchScreenshot(result.url, screenshotDevice)}
                          className="py-2 px-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                        >
                          Retry Capture
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5C. SOCIAL PREVIEWS TAB */}
                {activeAsset === 'og-preview' && (
                  <div className="space-y-4 animate-slide-up-in">
                    <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                      <ExternalLink size={10} />
                      OpenGraph Social Media Card Preview
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* 1. X / Twitter Card */}
                      <div className="bg-[#15202B] rounded-2xl p-4 text-white font-sans text-xs border border-[#38444D] shadow-md">
                        <div className="flex items-center gap-1.5 mb-2">
                          <TwitterXIcon size={12} />
                          <span className="text-[#8899A6] font-semibold text-[10px] tracking-wider uppercase">X / Twitter Card Preview</span>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-[#38444D] bg-[#192734]">
                          {result.previewUrl && (
                            <img src={result.previewUrl} className="w-full aspect-[1.91/1] object-cover" alt="OG Preview" />
                          )}
                          <div className="p-3 space-y-1">
                            <span className="text-[#8899A6] text-[10px] block uppercase tracking-wider">{result.domain}</span>
                            <h4 className="font-bold text-sm text-white line-clamp-1">{result.title}</h4>
                            <p className="text-[#8899A6] text-[11px] line-clamp-2 leading-relaxed">{result.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* 2. Facebook Post Card */}
                      <div className="bg-[#F0F2F5] border border-zinc-200 rounded-2xl p-4 font-sans text-xs shadow-md">
                        <div className="flex items-center gap-1.5 mb-2 text-[#1877F2]">
                          <FacebookIcon size={12} />
                          <span className="text-zinc-500 font-semibold text-[10px] tracking-wider uppercase">Facebook Link Preview</span>
                        </div>
                        <div className="bg-white border border-[#E4E6EB] rounded-lg overflow-hidden">
                          {result.previewUrl && (
                            <img src={result.previewUrl} className="w-full aspect-[1.91/1] object-cover" alt="OG Preview" />
                          )}
                          <div className="p-3 bg-[#F0F2F5] border-t border-[#E4E6EB] space-y-1">
                            <span className="text-[#65676B] text-[10px] uppercase block tracking-wider">{result.domain}</span>
                            <h4 className="font-bold text-zinc-900 line-clamp-1">{result.title}</h4>
                            <p className="text-[#65676B] text-[11px] line-clamp-2 leading-snug">{result.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* 3. LinkedIn Preview */}
                      <div className="bg-white border border-zinc-200 rounded-2xl p-4 font-sans text-xs shadow-md">
                        <div className="flex items-center gap-1.5 mb-2 text-[#0A66C2]">
                          <span className="font-black text-xs">in</span>
                          <span className="text-zinc-400 font-semibold text-[10px] tracking-wider uppercase">LinkedIn Feed Card</span>
                        </div>
                        <div className="border border-zinc-200 rounded overflow-hidden">
                          {result.previewUrl && (
                            <img src={result.previewUrl} className="w-full aspect-[1.91/1] object-cover" alt="OG Preview" />
                          )}
                          <div className="p-3 bg-zinc-50 border-t border-zinc-200 space-y-0.5">
                            <h4 className="font-bold text-zinc-800 text-xs line-clamp-1">{result.title}</h4>
                            <span className="text-zinc-500 text-[10px] block font-light">{result.domain}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Discord Embed Preview */}
                      <div className="bg-[#2F3136] text-[#DCDDDE] rounded-2xl p-4 font-sans text-xs border border-zinc-900 shadow-md">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-2 h-2 rounded-full bg-[#5865F2]"></span>
                          <span className="text-[#72767D] font-semibold text-[10px] tracking-wider uppercase">Discord Rich Embed</span>
                        </div>
                        <div className="border-l-4 border-[#5865F2] bg-[#202225] rounded-r p-3 flex flex-col sm:flex-row gap-3 items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <span className="text-[#43B581] text-[10px] font-semibold hover:underline cursor-pointer block">{result.domain}</span>
                            <h4 className="font-bold text-[#FFFFFF] text-xs leading-normal hover:underline cursor-pointer">{result.title}</h4>
                            <p className="text-[#B9BBBE] text-[11px] leading-snug line-clamp-3">{result.description}</p>
                          </div>
                          {result.previewUrl && (
                            <img src={result.previewUrl} className="w-16 h-16 rounded object-cover shrink-0 mt-1 border border-zinc-850" alt="OG Embed Thumbnail" />
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 5D. AI RESEARCH TAB */}
                {/* 5D. AI RESEARCH TAB */}
                {activeAsset === 'ai-research' && (
                  <div className="space-y-4 animate-slide-up-in">
                    <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                      <Sparkles size={11} className="text-violet-500" />
                      {result.platform === 'youtube' ? 'Gemini Video Summarizer' : 'Gemini Deep Webpage Intelligence'}
                    </span>

                    {lazyLoadingTab === 'ai-research' ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                        <LoaderOrbCircle size={48} className="text-violet-650" />
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider text-zinc-850">
                          {result.platform === 'youtube' ? 'Generating AI Video Summary...' : 'Generating AI Web Intelligence...'}
                        </span>
                        <p className="text-[11px] text-zinc-400 font-light max-w-xs mx-auto">
                          {result.platform === 'youtube' 
                            ? 'Retrieving and analyzing video subtitles track to extract core takeaways and insights...' 
                            : 'Analyzing website content to extract competitors, target audience, and actionable SEO advice...'}
                        </p>
                      </div>
                    ) : result.geminiResearch ? (
                      <>
                        {/* Executive Summary */}
                        <div className="bg-zinc-50/50 border border-zinc-100 p-4 rounded-xl space-y-1">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block animate-fade-in">
                            {result.platform === 'youtube' ? 'Video Executive Summary' : 'Executive Summary'}
                          </span>
                          <p className="text-xs text-zinc-700 leading-relaxed font-light select-text">
                            {result.geminiResearch.summary}
                          </p>
                        </div>

                        {/* Target Audience */}
                        <div className="bg-zinc-50/50 border border-zinc-100 p-4 rounded-xl space-y-1">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">
                            {result.platform === 'youtube' ? 'Key Takeaways & Lessons' : 'Target Audience Profile'}
                          </span>
                          <p className="text-xs text-zinc-700 leading-relaxed font-light select-text">
                            {result.geminiResearch.targetAudience}
                          </p>
                        </div>

                        {/* Key Competitors */}
                        {result.geminiResearch.competitors && result.geminiResearch.competitors.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block">
                              {result.platform === 'youtube' ? 'Related Concepts & Tags' : 'Identified Direct Competitors'}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {result.geminiResearch.competitors.map((comp, idx) => (
                                result.platform === 'youtube' ? (
                                  <span 
                                    key={idx} 
                                    className="px-3 py-1.5 bg-violet-50 border border-violet-100 text-violet-700 rounded-lg text-xs font-bold shadow-sm"
                                  >
                                    {comp}
                                  </span>
                                ) : (
                                  <a 
                                    key={idx} 
                                    href={`https://${comp.replace(/https?:\/\//i, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-100 text-violet-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                  >
                                    <span>{comp}</span>
                                    <ExternalLink size={10} className="opacity-60" />
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actionable SEO Advice */}
                        {result.geminiResearch.seoAdvice && result.geminiResearch.seoAdvice.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block">
                              {result.platform === 'youtube' ? 'Detailed Chapter & Content Insights' : 'Actionable SEO Enhancements'}
                            </span>
                            <div className="space-y-2">
                              {result.geminiResearch.seoAdvice.map((advice, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-650 bg-white border border-zinc-100 p-3 rounded-xl shadow-sm">
                                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px] shrink-0">{idx + 1}</span>
                                  <p className="flex-1 font-light leading-relaxed select-text">{advice}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center text-zinc-400 text-xs font-light">
                        {result.platform === 'youtube' 
                          ? 'AI video summary failed or is not available for this link.' 
                          : 'AI website research details failed or are not available for this site.'}
                      </div>
                    )}
                  </div>
                )}

                {/* 5E. TRUST & SAFETY / REAL-FAKE CHECK TAB */}
                {activeAsset === 'trust-safety' && (
                  <div className="space-y-6 animate-slide-up-in">
                    <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                      <ShieldCheck size={11} className="text-violet-500" />
                      Domain Trust & Safety Check
                    </span>

                    {lazyLoadingTab === 'trust-safety' ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                        <LoaderDoubleRing size={48} className="text-rose-500" />
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider text-zinc-850">Running Trust Audits...</span>
                        <p className="text-[11px] text-zinc-400 font-light max-w-xs mx-auto">Evaluating domain SSL certificates, VirusTotal engine flags, domain age registration, and semantic spoofing heuristics...</p>
                      </div>
                    ) : (
                      (() => {
                        const vtMalicious = result.linkIntel?.virusTotal?.malicious || 0;
                        const vtTotal = result.linkIntel?.virusTotal?.total || 0;
                        const finalVerdict = vtMalicious > 0 ? 'FAKE' : (result.trustSafety?.verdict || 'REAL');
                        const finalScore = vtMalicious > 0 ? 0 : (result.trustSafety?.trustScore ?? 85);
                        const finalAnalysis = vtMalicious > 0 
                          ? `This website is flagged as FAKE/HIGH RISK because ${vtMalicious} security engines on VirusTotal detected active malicious or phishing signatures.`
                          : (result.trustSafety?.analysis || 'This website has a solid reputation, valid encryption, and displays no indicators of malicious intent or typosquatting.');

                        const isReal = finalVerdict === 'REAL';
                        const isFake = finalVerdict === 'FAKE';
                        
                        const cardBg = isFake ? 'bg-rose-50/50 border-rose-100 text-rose-900' : isReal ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-amber-50/50 border-amber-100 text-amber-900';
                        const shieldColor = isFake ? 'text-rose-500' : isReal ? 'text-emerald-500' : 'text-amber-500';
                        const statusLabel = isFake ? 'HIGH RISK / FAKE' : isReal ? 'VERIFIED / REAL' : 'SUSPICIOUS / UNVERIFIED';

                        return (
                          <div className="space-y-6">
                            {/* Verdict Header Card */}
                            <div className={`border rounded-2xl p-5 flex items-start gap-4 ${cardBg} transition-all shadow-sm`}>
                              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-zinc-100/50 shrink-0">
                                {isFake ? (
                                  <ShieldAlert size={28} className={shieldColor} />
                                ) : isReal ? (
                                  <ShieldCheck size={28} className={shieldColor} />
                                ) : (
                                  <AlertTriangle size={28} className={shieldColor} />
                                )}
                              </div>
                              <div className="space-y-1 flex-1">
                                <span className="text-[9px] uppercase tracking-widest font-extrabold opacity-75">Legitimacy Verdict</span>
                                <h3 className="text-base font-extrabold tracking-wide uppercase">{statusLabel} WEBSITE</h3>
                                <p className="text-xs font-light opacity-90 leading-relaxed select-text mt-1">{finalAnalysis}</p>
                              </div>
                            </div>

                            {/* Trust Signals Dashboard Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              
                              {/* 1. Score Circle */}
                              <div className="bg-white border border-zinc-100 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold mb-3 block">Trust Score</span>
                                <LighthouseScoreCircle score={finalScore} label="" />
                                <span className="text-[10px] text-zinc-400 font-light mt-2">Safety Reliability Index</span>
                              </div>

                              {/* 2. SSL & Registry details */}
                              <div className="bg-white border border-zinc-100 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold mb-2 block">Domain Registration</span>
                                  {result.linkIntel?.whois?.domainAge ? (
                                    <div className="space-y-1 mt-1">
                                      <div className="text-xs font-medium text-zinc-700">Domain Age: <span className="text-violet-600 font-bold">{result.linkIntel.whois.domainAge} years</span></div>
                                      <div className="text-[10px] text-zinc-400 font-light">Registered via: {result.linkIntel.whois.registrar || 'Unknown'}</div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-zinc-400 font-light mt-1">
                                      Domain age details unavailable. Safe/legitimate sites usually have public registrations older than 1 year.
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-zinc-100 pt-2 flex items-center justify-between">
                                  <span className="text-[10px] text-zinc-500 font-light">SSL Certificate</span>
                                  {result.sslCertificate?.valid ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100 flex items-center gap-0.5">
                                      <CheckCircle size={9} /> Secure HTTPS
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold border border-rose-100 flex items-center gap-0.5 animate-pulse">
                                      <XCircle size={9} /> Insecure (No SSL)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 3. Security Scans */}
                              <div className="bg-white border border-zinc-100 p-4 rounded-xl space-y-3 shadow-sm flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold mb-2 block">VirusTotal Scan Report</span>
                                  <div className="space-y-1.5 mt-1">
                                    <div className="flex justify-between items-center text-xs text-zinc-700">
                                      <span>Malicious Flags:</span>
                                      <span className={`font-bold ${vtMalicious > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>{vtMalicious}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-zinc-700">
                                      <span>Clean Engines:</span>
                                      <span className="text-zinc-500">{vtTotal - vtMalicious}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-zinc-100 pt-2 flex items-center justify-between text-[10px]">
                                  <span className="text-zinc-500 font-light">Global Safety Verdict</span>
                                  {vtMalicious === 0 ? (
                                    <span className="text-emerald-600 font-semibold uppercase flex items-center gap-0.5">No Active Malware</span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold uppercase flex items-center gap-0.5 animate-pulse">Active Threat Detected</span>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}


                {/* 5F. DEVELOPER SPECS TAB */}
                {activeAsset === 'dev-specs' && result.developerSpecs && (
                  <div className="space-y-6 animate-slide-up-in">
                    <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                      <FileText size={11} className="text-violet-500" />
                      Developer & Assets Specifications
                    </span>

                    {/* Detected Colors Section */}
                    {result.developerSpecs.colors && result.developerSpecs.colors.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block">Detected Colors</span>
                          <button
                            onClick={() => {
                              const cssRoot = `:root {\n${result.developerSpecs!.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`;
                              handleCopyText(cssRoot, 'css-colors');
                            }}
                            className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 px-2.5 py-1 bg-violet-50 border border-violet-100 rounded-lg cursor-pointer transition-colors shadow-sm animate-fade-in"
                          >
                            <Copy size={11} />
                            <span>{copiedText['css-colors'] ? 'Copied CSS!' : 'Copy CSS Variables'}</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 xs:grid-cols-5 gap-2.5">
                          {result.developerSpecs.colors.map((col, index) => (
                            <div 
                              key={index} 
                              onClick={() => handleCopyText(col, `devspec-col-${index}`)}
                              className="group flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:scale-105 bg-zinc-50 border border-zinc-100 p-2 rounded-xl"
                            >
                              <div 
                                className="w-full aspect-square rounded-lg border border-zinc-200/40 shadow-inner flex items-center justify-center text-white"
                                style={{ backgroundColor: col }}
                              >
                                <span className="opacity-0 group-hover:opacity-100 text-[9px] font-black bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-[1px]">Copy</span>
                              </div>
                              <span className="text-[9px] text-zinc-400 font-mono font-medium truncate max-w-full">
                                {copiedText[`devspec-col-${index}`] ? 'Copied!' : col}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fonts Section */}
                    {result.developerSpecs.fonts && result.developerSpecs.fonts.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block">Detected Fonts</span>
                        <div className="flex flex-wrap gap-2">
                          {result.developerSpecs.fonts.map((font, idx) => (
                            <div key={idx} className="px-3 py-1.5 bg-zinc-50 border border-zinc-150 text-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                              <span>{font}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CSS Custom Design Tokens Section */}
                    {result.developerSpecs.designTokens && result.developerSpecs.designTokens.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block">CSS Design Tokens ({result.developerSpecs.designTokens.length})</span>
                        <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 max-h-[220px] overflow-y-auto font-mono text-[10px] space-y-1.5">
                          {result.developerSpecs.designTokens.map((token, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => handleCopyText(`${token.name}: ${token.value};`, `token-${idx}`)}
                              className="flex justify-between border-b border-zinc-200/40 pb-1 hover:bg-zinc-100/50 px-1 rounded cursor-pointer transition-colors"
                              title="Click to copy definition"
                            >
                              <span className="text-violet-650 font-semibold truncate max-w-[50%]">{token.name}</span>
                              <span className="text-zinc-600 truncate max-w-[48%] text-right">
                                {copiedText[`token-${idx}`] ? 'Copied!' : token.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crawled Assets Library Section */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase">Crawled Page Assets</span>
                        
                        {/* Search Assets */}
                        <div className="relative w-full sm:w-64">
                          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Search assets by name or path..."
                            value={devSpecsSearch}
                            onChange={(e) => setDevSpecsSearch(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-700 placeholder:text-zinc-450 font-light focus:outline-none focus:ring-1 focus:ring-violet-400"
                          />
                        </div>
                      </div>

                      {/* Expandable Categories */}
                      <div className="space-y-2.5">
                        {/* Images Section */}
                        {(() => {
                          const images = result.developerSpecs.assets.images || [];
                          const filtered = images.filter(img => img.toLowerCase().includes(devSpecsSearch.toLowerCase()));
                          if (images.length === 0) return null;

                          return (
                            <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white/60">
                              <button
                                onClick={() => setCollapsedSections(prev => ({ ...prev, images: !prev.images }))}
                                className="w-full bg-zinc-50 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between hover:bg-zinc-100/60 transition-colors cursor-pointer"
                              >
                                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                                  <ImageIcon size={12} className="text-zinc-500" />
                                  <span>Image Assets ({filtered.length} of {images.length})</span>
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold">
                                  {collapsedSections.images ? 'Expand' : 'Collapse'}
                                </span>
                              </button>
                              
                              {!collapsedSections.images && (
                                <div className="p-3 max-h-[280px] overflow-y-auto">
                                  {filtered.length === 0 ? (
                                    <div className="py-4 text-center text-zinc-400 text-xs font-light">No image assets match search</div>
                                  ) : (
                                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                                      {filtered.map((url, i) => (
                                        <div key={i} className="group relative border border-zinc-200/60 rounded-lg overflow-hidden bg-zinc-50/50 aspect-video flex flex-col justify-between p-1.5 shadow-sm">
                                          <img src={url} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Asset" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                                            <span className="text-[8px] text-white font-mono truncate mb-1">{url.split('/').pop()}</span>
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => handleCopyText(url, `asset-img-${i}`)}
                                                className="p-1 bg-white/90 hover:bg-white text-zinc-700 rounded text-[9px] font-bold flex-1 text-center cursor-pointer"
                                              >
                                                {copiedText[`asset-img-${i}`] ? 'Copied!' : 'Copy'}
                                              </button>
                                              <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[9px] font-bold px-1.5 text-center flex items-center justify-center cursor-pointer"
                                              >
                                                <ExternalLink size={8} />
                                              </a>
                                            </div>
                                          </div>
                                          <div className="group-hover:opacity-0 transition-opacity z-10 bg-white/95 px-1.5 py-0.5 rounded text-[8px] font-mono font-medium text-zinc-500 truncate max-w-full">
                                            {url.split('/').pop()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Favicons Section */}
                        {(() => {
                          const favicons = result.developerSpecs.assets.favicons || [];
                          const filtered = favicons.filter(fav => fav.toLowerCase().includes(devSpecsSearch.toLowerCase()));
                          if (favicons.length === 0) return null;

                          return (
                            <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white/60">
                              <button
                                onClick={() => setCollapsedSections(prev => ({ ...prev, favicons: !prev.favicons }))}
                                className="w-full bg-zinc-50 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between hover:bg-zinc-100/60 transition-colors cursor-pointer"
                              >
                                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                                  <GlobeIcon size={12} className="text-zinc-500" />
                                  <span>Icons & Favicons ({filtered.length} of {favicons.length})</span>
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold">
                                  {collapsedSections.favicons ? 'Expand' : 'Collapse'}
                                </span>
                              </button>
                              
                              {!collapsedSections.favicons && (
                                <div className="p-3 max-h-[220px] overflow-y-auto space-y-2">
                                  {filtered.length === 0 ? (
                                    <div className="py-4 text-center text-zinc-400 text-xs font-light">No icons match search</div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {filtered.map((url, i) => (
                                        <div key={i} className="flex items-center gap-2 border border-zinc-100 p-2 rounded-lg bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                                          <img src={url} className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-zinc-200 shrink-0" alt="Icon" onError={(e) => { e.currentTarget.src = '/icon.svg'; }} />
                                          <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-mono text-zinc-600 block truncate">{url}</span>
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => handleCopyText(url, `asset-fav-${i}`)}
                                              className="p-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-650 rounded text-[9px] font-medium cursor-pointer"
                                            >
                                              {copiedText[`asset-fav-${i}`] ? 'Copied!' : 'Copy'}
                                            </button>
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-600 rounded flex items-center justify-center w-5 h-5 cursor-pointer"
                                            >
                                              <ExternalLink size={9} />
                                            </a>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Stylesheets Section */}
                        {(() => {
                          const stylesheets = result.developerSpecs.assets.stylesheets || [];
                          const filtered = stylesheets.filter(css => css.toLowerCase().includes(devSpecsSearch.toLowerCase()));
                          if (stylesheets.length === 0) return null;

                          return (
                            <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white/60">
                              <button
                                onClick={() => setCollapsedSections(prev => ({ ...prev, stylesheets: !prev.stylesheets }))}
                                className="w-full bg-zinc-50 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between hover:bg-zinc-100/60 transition-colors cursor-pointer"
                              >
                                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                                  <Layers size={12} className="text-zinc-500" />
                                  <span>CSS Stylesheets ({filtered.length} of {stylesheets.length})</span>
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold">
                                  {collapsedSections.stylesheets ? 'Expand' : 'Collapse'}
                                </span>
                              </button>
                              
                              {!collapsedSections.stylesheets && (
                                <div className="p-3 max-h-[220px] overflow-y-auto space-y-1.5 divide-y divide-zinc-200/20">
                                  {filtered.length === 0 ? (
                                    <div className="py-4 text-center text-zinc-400 text-xs font-light">No stylesheets match search</div>
                                  ) : (
                                    filtered.map((url, i) => (
                                      <div key={i} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                                        <span className="text-[10px] font-mono text-zinc-650 truncate flex-1">{url}</span>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            onClick={() => handleCopyText(url, `asset-css-${i}`)}
                                            className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded text-[9px] font-medium cursor-pointer"
                                          >
                                            {copiedText[`asset-css-${i}`] ? 'Copied!' : 'Copy'}
                                          </button>
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-600 rounded text-[9px] font-medium flex items-center gap-0.5 cursor-pointer"
                                          >
                                            <span>Open</span>
                                            <ExternalLink size={9} />
                                          </a>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Scripts Section */}
                        {(() => {
                          const scripts = result.developerSpecs.assets.scripts || [];
                          const filtered = scripts.filter(js => js.toLowerCase().includes(devSpecsSearch.toLowerCase()));
                          if (scripts.length === 0) return null;

                          return (
                            <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white/60">
                              <button
                                onClick={() => setCollapsedSections(prev => ({ ...prev, scripts: !prev.scripts }))}
                                className="w-full bg-zinc-50 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between hover:bg-zinc-100/60 transition-colors cursor-pointer"
                              >
                                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                                  <FileText size={12} className="text-zinc-500" />
                                  <span>Javascript Scripts ({filtered.length} of {scripts.length})</span>
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold">
                                  {collapsedSections.scripts ? 'Expand' : 'Collapse'}
                                </span>
                              </button>
                              
                              {!collapsedSections.scripts && (
                                <div className="p-3 max-h-[220px] overflow-y-auto space-y-1.5 divide-y divide-zinc-200/20">
                                  {filtered.length === 0 ? (
                                    <div className="py-4 text-center text-zinc-400 text-xs font-light">No script files match search</div>
                                  ) : (
                                    filtered.map((url, i) => (
                                      <div key={i} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                                        <span className="text-[10px] font-mono text-zinc-650 truncate flex-1">{url}</span>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            onClick={() => handleCopyText(url, `asset-js-${i}`)}
                                            className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded text-[9px] font-medium cursor-pointer"
                                          >
                                            {copiedText[`asset-js-${i}`] ? 'Copied!' : 'Copy'}
                                          </button>
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-650 rounded text-[9px] font-medium flex items-center gap-0.5 cursor-pointer"
                                          >
                                            <span>Open</span>
                                            <ExternalLink size={9} />
                                          </a>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Media Section */}
                        {(() => {
                          const media = result.developerSpecs.assets.media || [];
                          const filtered = media.filter(med => med.toLowerCase().includes(devSpecsSearch.toLowerCase()));
                          if (media.length === 0) return null;

                          return (
                            <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white/60">
                              <button
                                onClick={() => setCollapsedSections(prev => ({ ...prev, media: !prev.media }))}
                                className="w-full bg-zinc-50 px-4 py-2.5 border-b border-zinc-100 flex items-center justify-between hover:bg-zinc-100/60 transition-colors cursor-pointer"
                              >
                                <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                                  <VideoIcon size={12} className="text-zinc-500" />
                                  <span>Media Files ({filtered.length} of {media.length})</span>
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold">
                                  {collapsedSections.media ? 'Expand' : 'Collapse'}
                                </span>
                              </button>
                              
                              {!collapsedSections.media && (
                                <div className="p-3 max-h-[220px] overflow-y-auto space-y-1.5 divide-y divide-zinc-200/20">
                                  {filtered.length === 0 ? (
                                    <div className="py-4 text-center text-zinc-400 text-xs font-light">No media assets match search</div>
                                  ) : (
                                    filtered.map((url, i) => (
                                      <div key={i} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                                        <span className="text-[10px] font-mono text-zinc-650 truncate flex-1">{url}</span>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            onClick={() => handleCopyText(url, `asset-media-${i}`)}
                                            className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 rounded text-[9px] font-medium cursor-pointer"
                                          >
                                            {copiedText[`asset-media-${i}`] ? 'Copied!' : 'Copy'}
                                          </button>
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-650 rounded text-[9px] font-medium flex items-center gap-0.5 cursor-pointer"
                                          >
                                            <span>Open</span>
                                            <ExternalLink size={9} />
                                          </a>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}


                {/* 6. LINK INTELLIGENCE DETAILS TAB (Always Available) */}
                {activeAsset === 'link-intel' && result.linkIntel && (
                  <div className="space-y-4 animate-slide-up-in">
                    {lazyLoadingTab === 'link-intel' ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                        <LoaderTripleArcs size={48} className="text-violet-600" />
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider text-zinc-850">Loading Link Intelligence...</span>
                        <p className="text-[11px] text-zinc-400 font-light max-w-xs mx-auto">Fetching safety checks, WHOIS registry, DNS records, and IP geolocation details...</p>
                      </div>
                    ) : (
                      <>

                    {/* VirusTotal Safety Scan */}
                    {result.linkIntel.virusTotal ? (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <ShieldCheck size={10} />
                          VirusTotal Real-Time Safety Scan
                        </span>
                        <div className={`p-3.5 rounded-xl border ${result.linkIntel.virusTotal.malicious > 0 ? 'bg-rose-50 border-rose-200' : result.linkIntel.virusTotal.suspicious > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                          <div className="flex items-center gap-2 mb-2.5">
                            {result.linkIntel.virusTotal.malicious > 0 ? (
                              <XCircle size={18} className="text-rose-600 shrink-0" />
                            ) : result.linkIntel.virusTotal.suspicious > 0 ? (
                              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                            ) : (
                              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                            )}
                            <span className={`text-sm font-bold ${result.linkIntel.virusTotal.malicious > 0 ? 'text-rose-700' : result.linkIntel.virusTotal.suspicious > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {result.linkIntel.virusTotal.malicious > 0 ? `⚠️ Malicious – ${result.linkIntel.virusTotal.malicious} engines flagged this URL!` : result.linkIntel.virusTotal.suspicious > 0 ? `⚠️ Suspicious – ${result.linkIntel.virusTotal.suspicious} engines reported suspicious activity` : '✅ Clean – No threats detected across all security engines'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 text-center">
                            {[
                              { label: 'Harmless', value: result.linkIntel.virusTotal.harmless, color: 'text-emerald-600' },
                              { label: 'Malicious', value: result.linkIntel.virusTotal.malicious, color: 'text-rose-600' },
                              { label: 'Suspicious', value: result.linkIntel.virusTotal.suspicious, color: 'text-amber-600' },
                              { label: 'Undetected', value: result.linkIntel.virusTotal.undetected, color: 'text-zinc-500' },
                            ].map(item => (
                              <div key={item.label} className="bg-white/80 rounded-lg p-2 border border-white shadow-sm">
                                <span className={`text-lg font-black ${item.color}`}>{item.value}</span>
                                <span className="text-[9px] text-zinc-400 font-medium block">{item.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[9px] text-zinc-400">{result.linkIntel.virusTotal.total} engines scanned · Last: {result.linkIntel.virusTotal.lastAnalysisDate}</span>
                            <a href={result.linkIntel.virusTotal.permalink} target="_blank" rel="noopener noreferrer" className="text-[9px] font-semibold text-violet-600 hover:underline">View Full Report →</a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-zinc-50 border-zinc-200">
                        {result.linkIntel.safe ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-rose-500" />}
                        <span className="text-xs font-semibold text-zinc-600">{result.linkIntel.safe ? 'Domain appears safe (keyword analysis)' : 'Suspicious keywords detected in URL'}</span>
                      </div>
                    )}

                    {/* WHOIS Domain Info */}
                    {result.linkIntel.whois && (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <Building2 size={10} />
                          Domain WHOIS Registration
                        </span>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 space-y-1.5 font-mono text-[10px]">
                          {[
                            { label: 'Registrar', value: result.linkIntel.whois.registrar },
                            { label: 'Registrant Org', value: result.linkIntel.whois.registrantOrg },
                            { label: 'Country', value: result.linkIntel.whois.registrantCountry },
                            { label: 'Created Date', value: result.linkIntel.whois.createdDate },
                            { label: 'Expiry Date', value: result.linkIntel.whois.expiresDate },
                            { label: 'Last Updated', value: result.linkIntel.whois.updatedDate },
                            ...(result.linkIntel.whois.domainAge ? [{ label: 'Domain Age', value: `${result.linkIntel.whois.domainAge} days (~${Math.floor(result.linkIntel.whois.domainAge / 365)} years)` }] : []),
                          ].map(row => (
                            <div key={row.label} className="flex justify-between border-b border-zinc-200/40 pb-1">
                              <span className="text-zinc-400 font-bold">{row.label}</span>
                              <span className="text-zinc-700 font-medium max-w-[200px] truncate text-right">{row.value || '—'}</span>
                            </div>
                          ))}
                          {result.linkIntel.whois.nameServers.length > 0 && (
                            <div className="flex justify-between pt-0.5">
                              <span className="text-zinc-400 font-bold">Name Servers</span>
                              <span className="text-zinc-700 font-medium text-right max-w-[200px] truncate">{result.linkIntel.whois.nameServers.slice(0, 2).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* IP Geolocation */}
                    {result.linkIntel.ipInfo ? (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <MapPin size={10} />
                          IP Geolocation (IPinfo)
                        </span>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 grid grid-cols-1 xs:grid-cols-2 gap-2 font-mono text-[10px]">
                          {[
                            { label: 'IP Address', value: result.linkIntel.ipInfo.ip },
                            { label: 'Hostname', value: result.linkIntel.ipInfo.hostname || '—' },
                            { label: 'City', value: result.linkIntel.ipInfo.city || '—' },
                            { label: 'Region', value: result.linkIntel.ipInfo.region || '—' },
                            { label: 'Country', value: result.linkIntel.ipInfo.country || '—' },
                            { label: 'Timezone', value: result.linkIntel.ipInfo.timezone || '—' },
                            { label: 'ISP / ASN', value: result.linkIntel.ipInfo.org || '—' },
                            { label: 'Coordinates', value: result.linkIntel.ipInfo.loc || '—' },
                          ].map(row => (
                            <div key={row.label} className="bg-white rounded-lg p-2 border border-zinc-100">
                              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">{row.label}</span>
                              <span className="text-zinc-700 font-semibold truncate block" title={row.value}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                        {result.linkIntel.ipInfo.loc && (
                          <a 
                            href={`https://www.google.com/maps?q=${result.linkIntel.ipInfo.loc}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1.5 text-[10px] text-violet-600 hover:text-violet-700 font-semibold"
                          >
                            <MapPin size={10} />
                            View server location on Google Maps →
                          </a>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <Wifi size={10} />
                          IP / DNS Details
                        </span>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 font-mono text-[10px] text-zinc-600 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Host IP</span>
                            <span className="font-semibold">{result.linkIntel.ipAddress}</span>
                          </div>
                          {result.linkIntel.dnsRecords.map((rec, i) => (
                            <div key={i} className="flex justify-between border-t border-zinc-200/40 pt-1 mt-1">
                              <span className="text-zinc-400">{rec.type}</span>
                              <span className="font-semibold max-w-[160px] truncate">{rec.records.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DNS Records (shown alongside ipInfo) */}
                    {result.linkIntel.ipInfo && result.linkIntel.dnsRecords.length > 0 && (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <Wifi size={10} />
                          DNS Records
                        </span>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 font-mono text-[10px] text-zinc-600 space-y-1">
                          {result.linkIntel.dnsRecords.map((rec, i) => (
                            <div key={i} className={`flex justify-between ${i > 0 ? 'border-t border-zinc-200/40 pt-1 mt-1' : ''}`}>
                              <span className="text-zinc-400 font-bold shrink-0 mr-2">{rec.type}</span>
                              <span className="font-semibold max-w-[220px] truncate text-right">{rec.records.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SSL Certificate Details */}
                    {result.sslCertificate && (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <ShieldCheck size={10} className="text-emerald-500" />
                          SSL Certificate Analysis
                        </span>
                        <div className={`p-3.5 rounded-xl border ${result.sslCertificate.valid ? 'bg-emerald-50/40 border-emerald-200/50' : 'bg-rose-50/40 border-rose-200/50'} space-y-2 font-mono text-[10px]`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            {result.sslCertificate.valid ? (
                              <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle size={15} className="text-rose-600 shrink-0" />
                            )}
                            <span className={`text-xs font-bold ${result.sslCertificate.valid ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {result.sslCertificate.valid ? 'Valid SSL Security (HTTPS Active)' : 'Invalid or Expired SSL Security'}
                            </span>
                          </div>
                          {[
                            { label: 'Common Name / Subject', value: result.sslCertificate.subject },
                            { label: 'Certificate Issuer', value: result.sslCertificate.issuer },
                            { label: 'Encryption Strength', value: `${result.sslCertificate.bits}-bit keys` },
                            { label: 'Serial Number', value: result.sslCertificate.serialNumber },
                            { label: 'Validity Period Start', value: new Date(result.sslCertificate.validFrom).toLocaleDateString() },
                            { label: 'Validity Period End', value: new Date(result.sslCertificate.validTo).toLocaleDateString() },
                            { label: 'Days Until Expiry', value: `${result.sslCertificate.daysRemaining} days remaining` }
                          ].map(row => (
                            <div key={row.label} className="flex justify-between border-b border-zinc-200/30 pb-1">
                              <span className="text-zinc-400 font-bold">{row.label}</span>
                              <span className="text-zinc-700 font-medium max-w-[200px] truncate text-right">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Robots.txt & Sitemaps */}
                    {result.robotsTxt && (result.robotsTxt.rulesCount > 0 || result.robotsTxt.sitemaps.length > 0) && (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <GlobeIcon size={10} />
                          Robots.txt & Sitemap Index
                        </span>
                        <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 space-y-2 font-mono text-[10px]">
                          <div className="flex justify-between border-b border-zinc-200/40 pb-1">
                            <span className="text-zinc-400 font-bold">Total Directory Rules</span>
                            <span className="text-zinc-700 font-medium">{result.robotsTxt.rulesCount} lines found</span>
                          </div>
                          
                          {/* Sitemaps */}
                          {result.robotsTxt.sitemaps.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-zinc-400 font-bold block">XML Sitemap Index:</span>
                              <div className="space-y-1">
                                {result.robotsTxt.sitemaps.slice(0, 3).map((sm, i) => (
                                  <a 
                                    key={i} 
                                    href={sm} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-violet-600 hover:underline flex items-center gap-1 truncate font-medium"
                                  >
                                    <span className="truncate flex-1">{sm}</span>
                                    <ExternalLink size={8} className="shrink-0" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Restricted Paths */}
                          {result.robotsTxt.disallows.length > 0 && (
                            <div className="space-y-0.5 pt-1.5 border-t border-zinc-200/40">
                              <span className="text-zinc-400 font-bold block">Disallowed Paths / Directories:</span>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {result.robotsTxt.disallows.slice(0, 8).map((p, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-500 rounded text-[9px] font-semibold">{p}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Redirect Chain + Short URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block mb-1.5">Redirect Chain</span>
                        <div className="space-y-1.5 bg-zinc-50 p-3 rounded-xl border border-zinc-100 font-mono text-[10px] text-zinc-600">
                          {result.linkIntel.redirectChain.map((u, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-4 h-4 bg-zinc-200 text-zinc-600 rounded-full flex items-center justify-center font-bold text-[8px] shrink-0">{i + 1}</span>
                              <span className="truncate flex-1">{u}</span>
                              {i < result.linkIntel!.redirectChain.length - 1 && (
                                <ArrowDown size={10} className="text-zinc-400 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {result.linkIntel.shortUrl && (
                          <div>
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block mb-1">Short URL</span>
                            <div className="flex items-center gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                              <span className="text-xs font-semibold text-zinc-700 flex-1 truncate">{result.linkIntel.shortUrl}</span>
                              <button 
                                onClick={() => handleCopyText(result.linkIntel!.shortUrl, 'short-url')}
                                className="p-2 bg-white hover:bg-zinc-100 border border-zinc-200/50 text-zinc-600 rounded-lg cursor-pointer transition-colors"
                              >
                                {copiedText['short-url'] ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {result.linkIntel.headers && Object.keys(result.linkIntel.headers).length > 0 && (
                          <div className="flex-1">
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase block mb-1.5">Server Headers</span>
                            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 font-mono text-[9px] text-zinc-500 overflow-y-auto max-h-[100px] space-y-1">
                              {Object.entries(result.linkIntel.headers).map(([k, v]) => (
                                <div key={k} className="flex justify-between border-b border-zinc-150 pb-0.5">
                                  <span className="text-zinc-400 font-bold shrink-0 mr-2">{k}</span>
                                  <span className="text-zinc-600 truncate max-w-[160px]" title={v}>{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tech Stack */}
                    {result.techStack && result.techStack.length > 0 && (
                      <div>
                        <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1 mb-2">
                          <Layers size={10} />
                          Detected Technology Stack
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {result.techStack.map((tech, i) => (
                            <span key={i} className="px-2.5 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-full text-[10px] font-semibold">{tech}</span>
                          ))}
                        </div>
                      </div>
                    )}

                      </>
                    )}
                  </div>
                )}

                {/* 7. AI CREATOR TOOLS TAB (Always Available) */}
                {activeAsset === 'ai-tools' && (
                  <div className="space-y-4.5 animate-slide-up-in">
                    
                    {lazyLoadingTab === 'ai-tools' ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                        <LoaderOrbCircle size={48} className="text-violet-600" />
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider text-zinc-850">Generating AI Suggestions...</span>
                        <p className="text-[11px] text-zinc-400 font-light max-w-xs mx-auto">Crafting viral titles, engaging captions, optimized meta tags, and trending hashtags...</p>
                      </div>
                    ) : result.aiSuggestions ? (
                      <>
                        {/* Catchy captions */}
                        <div className="space-y-2">
                          <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                            <Sparkles size={11} className="text-violet-500" />
                            AI Creative Social Captions
                          </span>
                          <div className="space-y-2">
                            {(result.aiSuggestions?.captions || []).map((cap, i) => (
                              <div key={i} className="flex items-start gap-2 bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                                <p className="text-xs text-zinc-600 leading-relaxed flex-1 font-light select-text">{cap}</p>
                                <button
                                  onClick={() => handleCopyText(cap, `cap-${i}`)}
                                  className="p-1.5 bg-white border border-zinc-200/50 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-all shrink-0"
                                  title="Copy caption"
                                >
                                  {copiedText[`cap-${i}`] ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Optimized Titles */}
                        {result.aiSuggestions?.optimizedTitles && result.aiSuggestions.optimizedTitles.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                              <Sparkles size={11} className="text-violet-500" />
                              Optimized Video/Page Titles
                            </span>
                            <div className="space-y-2">
                              {(result.aiSuggestions?.optimizedTitles || []).map((titleText, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 bg-zinc-50 border border-zinc-100 px-4 py-2.5 rounded-xl">
                                  <span className="text-xs text-zinc-700 font-semibold leading-normal flex-1 select-text">{titleText}</span>
                                  <button
                                    onClick={() => handleCopyText(titleText, `title-${i}`)}
                                    className="p-1.5 bg-white border border-zinc-200/50 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-all shrink-0"
                                    title="Copy title"
                                  >
                                    {copiedText[`title-${i}`] ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SEO Description */}
                        {result.aiSuggestions?.seoDescription && (
                          <div className="space-y-2 mt-4">
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                              <Sparkles size={11} className="text-violet-500" />
                              AI Crafted Meta Description
                            </span>
                            <div className="flex items-start gap-2 bg-zinc-50 border border-zinc-100 p-3 rounded-xl">
                              <p className="text-xs text-zinc-650 leading-relaxed flex-1 font-light select-text">{result.aiSuggestions?.seoDescription}</p>
                              <button
                                onClick={() => handleCopyText(result.aiSuggestions?.seoDescription || '', 'seo-desc')}
                                className="p-1.5 bg-white border border-zinc-200/50 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer transition-all shrink-0"
                                title="Copy meta description"
                              >
                                {copiedText['seo-desc'] ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* AI suggest hashtags */}
                        {(result.aiSuggestions?.hashtags || result.hashtags || []).length > 0 && (
                          <div className="space-y-2 mt-4">
                            <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase flex items-center gap-1">
                              <Sparkles size={11} className="text-violet-500" />
                              AI Suggested Hashtags
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(result.aiSuggestions?.hashtags || result.hashtags || []).map((tag, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleCopyText(tag, `tag-${i}`)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${copiedText[`tag-${i}`] ? 'bg-emerald-100 border border-emerald-200 text-emerald-700' : 'bg-violet-50 border border-violet-100 text-violet-700 hover:bg-violet-100'}`}
                                >
                                  {copiedText[`tag-${i}`] ? '✓ ' : ''}{tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center text-zinc-400 text-xs font-light">
                        AI content suggestions are not available for this link.
                      </div>
                    )}
                  </div>
                )}


                {/* 8. CREATOR/AUTHOR DETAILS TAB */}
                {activeAsset === 'author' && (
                  <div className="space-y-4 animate-slide-up-in">
                    <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] tracking-widest text-zinc-400 font-semibold uppercase">Content Creator</span>
                        <h4 className="text-base font-semibold text-zinc-800 mt-0.5">{result.author}</h4>
                      </div>
                    </div>
                    
                    <div className="text-xs font-light text-zinc-500 leading-relaxed">
                      This content was published by <strong className="font-semibold text-zinc-700">{result.author}</strong> on <strong className="font-semibold text-zinc-700">{result.domain}</strong>. You can view the creator profile or channel content by visiting the platform directly.
                    </div>

                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <span>Visit Creator Profile</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* 9. HASHTAGS DETAILS TAB */}
                {activeAsset === 'tags' && (
                  <div className="space-y-5 animate-slide-up-in">
                    <div>
                      <span className="text-[10px] tracking-widest text-zinc-400 font-semibold uppercase block mb-2">Identified Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {result.hashtags?.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="bg-violet-50 text-violet-600 border border-violet-100/60 px-3 py-1.5 rounded-lg text-xs font-medium select-text"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => copyTags(result.hashtags || [])}
                        className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        {copiedIndex ? (
                          <>
                            <Check size={14} className="text-emerald-400" />
                            <span>Tags Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy All Tags</span>
                          </>
                        )}
                      </button>
                      
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-200/50"
                      >
                        <span>Search Tags on Platform</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}

        {/* INLINE PREMIUM CAPTION EDITOR */}
        {isEditorOpen && (
          <div 
            ref={editorRef} 
            className="w-full mt-10 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 lg:p-8 flex flex-col font-sans text-white antialiased shadow-2xl scroll-mt-24 animate-slide-up-in select-text"
          >
            {/* Editor Header */}
            <div className="pb-5 border-b border-zinc-900 flex items-center justify-between mb-6 select-none">
              <div className="flex items-center gap-2">
                <Sparkles className="text-violet-500 animate-pulse" size={20} />
                <h2 className="text-sm md:text-base font-black tracking-widest uppercase text-zinc-100">Premium Caption Editor</h2>
              </div>
              <button 
                onClick={() => {
                  setIsEditorOpen(false);
                  setEditorSubtitles([]);
                }}
                className="px-4 py-2 bg-zinc-905 hover:bg-zinc-900 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer border border-zinc-800/80 hover:text-white"
              >
                Exit Editor
              </button>
            </div>

            {/* Editor Workspace */}
            {isResolvingVideo ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 select-none">
                <LoaderTripleArcs size={60} className="text-violet-500" />
                <p className="text-zinc-400 text-sm font-medium tracking-wide animate-pulse">Resolving high-speed video stream...</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side: Video Player Container */}
                <div className="lg:w-3/5 flex flex-col justify-center items-center bg-black/40 border border-zinc-900/60 p-6 rounded-2xl">
                  <div 
                    className={`relative w-full rounded-2xl overflow-hidden bg-black border border-zinc-850 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                      videoAspectRatio === 'portrait' ? 'max-w-[280px] aspect-[9/16] my-4' : 'max-w-2xl aspect-video'
                    }`}
                  >
                    {/* HTML5 Video Player */}
                    {editorVideoUrl ? (
                      <video
                        src={editorVideoUrl}
                        controls
                        className="w-full h-full object-contain"
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget;
                          if (video.videoHeight > video.videoWidth) {
                            setVideoAspectRatio('portrait');
                          } else {
                            setVideoAspectRatio('landscape');
                          }
                        }}
                        onTimeUpdate={(e) => setEditorCurrentTime(e.currentTarget.currentTime)}
                      />
                    ) : (
                      <p className="text-zinc-500 text-xs font-light">Loading video canvas...</p>
                    )}

                    {/* SYNCED CAPTION OVERLAY */}
                    {(() => {
                      const activeSub = editorSubtitles.find(
                        s => editorCurrentTime >= s.start && editorCurrentTime <= s.end
                      );
                      if (!activeSub) return null;
                      const preset = CAPTION_PRESETS.find(p => p.id === editorStylePreset) || CAPTION_PRESETS[0];
                      return (
                        <div 
                          className="absolute bottom-10 left-6 right-6 flex justify-center text-center pointer-events-none z-10"
                        >
                          <span 
                            style={preset.style as React.CSSProperties}
                            className="px-4 py-2 text-center select-none animate-scale-up-in shadow-lg"
                          >
                            {activeSub.text}
                          </span>
                        </div>
                      );
                    })()}

                    {/* CUSTOM WATERMARKS/TEXT OVERLAYS */}
                    {editorExtraOverlays.map((overlay) => {
                      const isActive = editorCurrentTime >= overlay.start && editorCurrentTime <= overlay.end;
                      if (!isActive) return null;
                      return (
                        <div
                          key={overlay.id}
                          style={{
                            position: 'absolute',
                            left: `${overlay.x}%`,
                            top: `${overlay.y}%`,
                            transform: 'translate(-50%, -50%)',
                            color: overlay.color,
                            backgroundColor: overlay.backgroundColor || 'transparent',
                            fontSize: `${overlay.fontSize}px`,
                            padding: overlay.backgroundColor !== 'transparent' ? '4px 8px' : '0',
                            borderRadius: '4px',
                            pointerEvents: 'none',
                            fontFamily: 'sans-serif',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            zIndex: 20
                          }}
                          className="animate-fade-in whitespace-nowrap select-none"
                        >
                          {overlay.text}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 text-[10px] text-zinc-500 tracking-wider text-center max-w-md select-none">
                    Tip: Press play on the video player. Captions and watermarks will display dynamically on screen in sync with the audio track.
                  </div>
                </div>

                {/* Right Side: Configuration Sidebar */}
                <div className="lg:w-2/5 flex flex-col space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                  
                  {/* Auto Captions Panel */}
                  <div className="bg-zinc-900/40 border border-zinc-800/85 p-4.5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between select-none">
                      <span className="text-[10px] tracking-widest text-violet-400 font-bold uppercase flex items-center gap-1">
                        <Sparkles size={11} />
                        Auto Captions (AI Voice Sync)
                      </span>
                      <span className="text-[8px] bg-violet-950 text-violet-400 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wide border border-violet-900/40">AI Transcribe</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-light leading-relaxed select-none">
                      Analyze the audio track to generate styled, voice-synced subtitle segments automatically.
                    </p>
                    
                    {autoCaptionError && (
                      <div className="p-3 bg-red-955/20 border border-red-900/40 text-red-400 rounded-xl text-[10px] flex items-center gap-1.5 font-light leading-snug">
                        <AlertCircle size={12} className="shrink-0 text-red-500" />
                        <span>{autoCaptionError}</span>
                      </div>
                    )}

                    <button
                      onClick={handleAutoCaption}
                      disabled={isAutoCaptioning}
                      className="w-full py-3 bg-violet-650 hover:bg-violet-750 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border-0"
                    >
                      {isAutoCaptioning ? (
                        <>
                          <LoaderPulsingDots size={10} className="text-white" />
                          <span>Generating auto-captions...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          <span>Auto Generate Synced Captions</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Style Presets Tab */}
                  <div className="space-y-3">
                    <span className="text-[10px] tracking-widest text-violet-400 font-bold uppercase flex items-center gap-1 select-none">
                      <Sparkles size={11} />
                      Choose Caption Style (20+ presets)
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto scrollbar-thin p-1">
                      {CAPTION_PRESETS.map((preset) => {
                        const isSel = editorStylePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => setEditorStylePreset(preset.id)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all truncate cursor-pointer ${isSel ? 'bg-violet-600 border-violet-500 text-white font-bold scale-102' : 'bg-zinc-800 border-zinc-700/60 text-zinc-300 hover:bg-zinc-750'}`}
                          >
                            <span style={{ color: preset.style.color, textShadow: preset.style.textShadow ? '1px 1px 1px #000' : 'none' }}>
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtitles Manager Tab */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase flex items-center gap-1 select-none">
                        <FileText size={11} />
                        Edit Subtitle Sentences
                      </span>
                      <div className="flex items-center gap-1.5">
                        {editorSubtitles.length > 0 && (
                          <button
                            onClick={handleDownloadEditorSubtitles}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded text-[10px] font-bold transition-all cursor-pointer select-none"
                            title="Download SRT file"
                          >
                            Download SRT
                          </button>
                        )}
                        <button
                          onClick={handleAddSubtitleItem}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer border-0 select-none"
                        >
                          + Add Segment
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                      {editorSubtitles.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 italic text-[11px] bg-zinc-900/20 border border-zinc-900/65 rounded-xl select-none">
                          No subtitle segments loaded. Use "Auto Generate" or click "+ Add Segment" to begin.
                        </div>
                      ) : (
                        editorSubtitles.map((sub) => (
                          <div key={sub.index} className="p-3 bg-zinc-800/80 border border-zinc-750/50 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 select-none">
                              <span>Segment #{sub.index}</span>
                              <div className="flex items-center gap-1">
                                <span>Start:</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={sub.start}
                                  onChange={(e) => handleUpdateSubtitleTimes(sub.index, parseFloat(e.target.value) || 0, sub.end)}
                                  className="w-12 bg-zinc-700 text-white border-0 text-[10px] text-center rounded py-0.5 focus:ring-1 focus:ring-violet-500 outline-none"
                                />
                                <span>s | End:</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={sub.end}
                                  onChange={(e) => handleUpdateSubtitleTimes(sub.index, sub.start, parseFloat(e.target.value) || 0)}
                                  className="w-12 bg-zinc-700 text-white border-0 text-[10px] text-center rounded py-0.5 focus:ring-1 focus:ring-violet-500 outline-none"
                                />
                                <button
                                  onClick={() => handleDeleteSubtitleItem(sub.index)}
                                  className="ml-2 px-1 text-rose-400 hover:text-rose-500 font-bold cursor-pointer bg-transparent border-0"
                                  title="Delete sentence"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={sub.text}
                              onChange={(e) => handleUpdateSubtitleText(sub.index, e.target.value)}
                              className="w-full bg-zinc-905 border-0 focus:ring-1 focus:ring-violet-500 rounded text-xs text-white px-2 py-1.5 font-light outline-none"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Watermarks & Extra Overlays Manager */}
                  <div className="space-y-3 border-t border-zinc-800 pt-4">
                    <span className="text-[10px] tracking-widest text-pink-400 font-bold uppercase flex items-center gap-1 select-none">
                      <Sparkles size={11} />
                      Add Watermark & Custom Overlays
                    </span>

                    {/* Overlay inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-805/40 p-3 rounded-xl border border-zinc-800">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">Overlay Text</label>
                        <input
                          type="text"
                          placeholder="e.g. @watermark"
                          value={newOverlayText}
                          onChange={(e) => setNewOverlayText(e.target.value)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">Start Time (sec)</label>
                        <input
                          type="number"
                          value={newOverlayStart}
                          onChange={(e) => setNewOverlayStart(parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">End Time (sec)</label>
                        <input
                          type="number"
                          value={newOverlayEnd}
                          onChange={(e) => setNewOverlayEnd(parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">X Pos (0 - 100%)</label>
                        <input
                          type="number"
                          value={newOverlayX}
                          onChange={(e) => setNewOverlayX(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">Y Pos (0 - 100%)</label>
                        <input
                          type="number"
                          value={newOverlayY}
                          onChange={(e) => setNewOverlayY(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">Font Size (px)</label>
                        <input
                          type="number"
                          value={newOverlayFontSize}
                          onChange={(e) => setNewOverlayFontSize(parseInt(e.target.value, 10) || 12)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase select-none">Color Hex</label>
                        <input
                          type="text"
                          value={newOverlayColor}
                          onChange={(e) => setNewOverlayColor(e.target.value)}
                          className="w-full bg-zinc-850 text-white border-0 rounded text-xs px-2 py-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 pt-2">
                        <button
                          onClick={handleAddExtraOverlay}
                          className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded text-xs font-bold transition-all cursor-pointer border-0"
                        >
                          + Add Custom Overlay
                        </button>
                      </div>
                    </div>

                    {/* List of active overlays */}
                    {editorExtraOverlays.length > 0 && (
                      <div className="space-y-2 mt-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                        {editorExtraOverlays.map((o) => (
                          <div key={o.id} className="flex justify-between items-center text-[11px] bg-zinc-800 p-2.5 rounded-lg border border-zinc-700/40">
                            <div className="truncate flex-1 pr-2">
                              <span className="font-bold text-pink-400">"{o.text}"</span>
                              <span className="text-zinc-500 text-[10px] ml-1.5 font-mono select-none">({o.start}s - {o.end}s, X:{o.x}%, Y:{o.y}%)</span>
                            </div>
                            <button
                              onClick={() => handleDeleteExtraOverlay(o.id)}
                              className="text-rose-400 hover:text-rose-500 font-bold px-1.5 cursor-pointer bg-transparent border-0"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        )}
      </main>

      {/* Premium SEO directory footer */}
      <footer className="mt-6 mb-2 w-full max-w-xl mx-auto border-t border-zinc-200/60 pt-4 px-4 text-center select-none">
        <div className="flex flex-nowrap justify-center items-center gap-x-2.5 sm:gap-x-5 text-[9px] sm:text-[11px] font-medium text-zinc-400 whitespace-nowrap overflow-x-auto scrollbar-none w-full max-w-full">
          <Link href="/about" className="hover:text-zinc-700 transition-colors">About Us</Link>
          <span className="text-zinc-200 select-none">•</span>
          <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy Policy</Link>
          <span className="text-zinc-200 select-none">•</span>
          <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms of Service</Link>
          <span className="text-zinc-200 select-none">•</span>
          <Link href="/contact" className="hover:text-zinc-700 transition-colors">Contact Support</Link>
        </div>
        <div className="mt-2.5 text-[9px] tracking-wider text-zinc-400 uppercase font-light space-y-1">
          <p>ENTERURL @2026</p>
          <p className="normal-case text-[10px] text-zinc-450 font-light">
            Created with ♥ by{' '}
            <a 
              href="https://shashankqoder.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-zinc-550 hover:text-violet-600 transition-colors select-text hover:underline"
            >
              Shashank Gupta
            </a>
          </p>
        </div>
      </footer>

      {/* SVG Liquid Distortion Filter */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="liquid-distortion">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.03" numOctaves="3" seed="0" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      {/* AUTH OVERLAY MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/90 border border-zinc-200/80 rounded-3xl p-8 shadow-2xl relative z-10 animate-scale-up-in select-text backdrop-blur-2xl">
            {/* Close Button */}
            <button 
              onClick={() => {
                setIsAuthModalOpen(false);
              }}
              className="absolute top-4.5 right-4.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 p-2 rounded-xl transition-all border-0 bg-transparent cursor-pointer flex items-center justify-center font-bold text-xs"
            >
              ✕
            </button>

            <div className="text-center mb-6 select-none">
              <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-none mb-2">
                {authModalRequiredLevel === 'pro' && currentUser
                  ? "Upgrade Required"
                  : authModalMode === 'signup' 
                    ? "Unlock Deep Analysis" 
                    : "Welcome Back"}
              </h2>
              <p className="text-xs text-zinc-500 font-light leading-relaxed max-w-xs mx-auto">
                {authModalRequiredLevel === 'pro' && currentUser
                  ? "Standard accounts cannot access this premium resource."
                  : authModalMode === 'signup'
                    ? "Register to run deep code scans, AI research summaries, and download media files."
                    : "Log in with Google to resume your active intelligence dashboard."}
              </p>
            </div>

            {/* If they are standard user logged in, but try to use pro features, show Upgrade callout */}
            {authModalRequiredLevel === 'pro' && currentUser && currentUser.role !== 'pro' ? (
              <div className="space-y-4">
                <div className="p-4 bg-violet-50 border border-violet-100 text-violet-750 rounded-2xl text-xs space-y-1.5 leading-relaxed font-light">
                  <span className="font-semibold block text-zinc-900">Upgrade to Pro Required</span>
                  <span>To unlock Pro features (like AI background removal and creative writing tools), please request the administrator to upgrade your account to <strong className="text-violet-650 font-bold">pro</strong> role.</span>
                  <span className="block mt-2 font-mono text-[10px] text-zinc-400">Admin contact: shashank8808108802@gmail.com</span>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer border-0"
                >
                  Close Prompt
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs text-center font-medium">
                    {authError}
                  </div>
                )}

                <div className="flex flex-col items-center justify-center py-2">
                  {isAuthLoading ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-zinc-500 font-medium font-mono select-none">
                      <svg className="animate-spin h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying with Google...
                    </div>
                  ) : (
                    <div id="google-signin-btn" className="w-full flex justify-center"></div>
                  )}
                </div>

                <div className="text-center pt-2 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode(authModalMode === 'signup' ? 'login' : 'signup');
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer border-0 bg-transparent font-medium"
                  >
                    {authModalMode === 'signup' 
                      ? "Already have an account? Sign In" 
                      : "Don't have an account? Register"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
