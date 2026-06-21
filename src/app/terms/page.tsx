import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - EnterURL Portal',
  description: 'Read the Terms of Service for EnterURL Portal covering acceptable use, fair usage quotas, and media downloading liability parameters.',
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">Terms of Service</h1>
          <p className="text-xs text-violet-650 uppercase tracking-widest font-extrabold flex items-center gap-1">
            <Scale size={12} />
            User Agreement & Acceptable Use
          </p>
        </div>

        {/* Text content */}
        <div className="text-zinc-650 text-xs sm:text-sm font-light leading-relaxed space-y-5">
          <p>
            By accessing or using the EnterURL platform (enterurl.vercel.app), you agree to be bound by these Terms of Service. If you do not agree to all terms, do not access or check links on this website.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">1. License & Acceptable Use</h3>
          <p>
            EnterURL grants you a personal, non-transferable, non-exclusive license to inspect domain analytics, scrape page tech stacks, check SSL files, download media files, and generate screenshots for personal or professional research purposes.
          </p>
          <p>
            You agree not to abuse the system by making automated requests (scraping our internal API routes with custom cron bots), trying to crash or overload the serverless functions, or attempting to bypass free/registered/pro tier permissions.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">2. Fair Use & Media Downloads</h3>
          <p>
            Our transcription, background removal, and media downloading features rely on premium backend APIs. Usage is gated based on your account level:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-500 font-mono text-[11px] select-none">
            <li><strong>Free (Anonymous):</strong> Access basic metadata extraction, link check info, and standard previews. Subject to daily IP rate-limiting.</li>
            <li><strong>Registered (Google Login):</strong> Unlocks screenshot check-ins, transcriptions, and standard downloader features.</li>
            <li><strong>Pro Tier:</strong> Unlocks background image removal and complex AI research summaries.</li>
          </ul>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">3. Copyright & Liability Disclaimer</h3>
          <p>
            EnterURL does not host, duplicate, or redistribute copyrighted media files. All scraping and downloading operations act as a proxy between your browser client and public platform links. You are solely responsible for compliance with third-party copyrights, licenses, and download agreements.
          </p>

          <h3 className="text-xs font-bold text-zinc-850 uppercase tracking-wider select-none">4. Modifications & Termination</h3>
          <p>
            We reserve the right to modify API features, adjust configuration tier gates, or suspend user access for abuse without prior notification.
          </p>
        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-200/60 pt-6 text-[10px] text-zinc-400 flex justify-between select-none">
          <span>Enterprise License Agreement</span>
          <span>Last Updated: June 2026</span>
        </div>

      </div>

      <footer className="mt-8 text-[10px] tracking-widest text-zinc-400 font-light select-none text-center">
        ENTERURL @2026
      </footer>
    </div>
  );
}
