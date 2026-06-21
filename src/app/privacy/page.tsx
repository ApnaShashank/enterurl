import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - EnterURL Portal',
  description: 'Understand how EnterURL Portal handles user data, cookies, URL caching, and API usage analytics parameters in our Privacy Policy.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 flex flex-col justify-start items-center px-4 py-16 relative overflow-hidden dots-bg font-sans select-text">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-600/5 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white/70 border border-zinc-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-8 animate-scale-up-in">
        
        {/* Back button */}
        <div className="flex justify-start select-none">
          <Link 
            href="/"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2 select-none">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">Privacy Policy</h1>
          <p className="text-xs text-violet-650 uppercase tracking-widest font-extrabold flex items-center gap-1">
            <Lock size={12} />
            Data Protection & Privacy Terms
          </p>
        </div>

        {/* Text content */}
        <div className="text-zinc-650 text-xs sm:text-sm font-light leading-relaxed space-y-5">
          <p>
            At EnterURL, accessible from enterurl.vercel.app, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by EnterURL and how we use it.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">1. Log Files and IP Tracking</h3>
          <p>
            EnterURL follows a standard procedure of logging website checks and API calls. The information logged includes Internet Protocol (IP) addresses, browser type, Date and Time stamps, referring/exit pages, and actions performed (such as downloading media, transcribing video, or taking screenshots). 
          </p>
          <p>
            This data is used solely for traffic analytics, system security checks, preventing abuse (such as bot attacks), and maintaining quotas for free/registered/pro accounts. These logs are stored in our secure database and are only accessible by system administrators.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">2. URL Analysis Caching</h3>
          <p>
            When you enter a URL for analysis, the results may be cached momentarily to improve response speeds for other users checking the same domain. We do not store or distribute raw downloaded files (videos, audios, or backgrounds) on our servers; they are proxied directly to your client browser or deleted immediately after generation.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">3. Cookies</h3>
          <p>
            Like any other website, EnterURL uses cookies to maintain sessions for registered users. Clerk helps us manage authentication sessions securely using standard encrypted cookies. These cookies are required to authenticate your account tier and verify permissions.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">4. Third-Party API Policies</h3>
          <p>
            EnterURL integrates third-party APIs (such as AssemblyAI, Deepgram, Gemini, Google Maps, and VirusTotal) to resolve specialized details. These services process variables (such as media URLs, domain names, or coordinates) according to their own strict compliance standards. We encourage you to review their respective privacy agreements.
          </p>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-200/60 pt-6 text-[10px] text-zinc-400 flex justify-between select-none">
          <span>Data Compliance Regulations</span>
          <span>Last Updated: June 2026</span>
        </div>

      </div>

      <footer className="mt-8 text-[10px] tracking-widest text-zinc-400 font-light select-none text-center">
        ENTERURL @2026
      </footer>
    </div>
  );
}
