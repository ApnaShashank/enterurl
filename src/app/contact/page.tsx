import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react';

export const metadata = {
  title: 'Contact Us - EnterURL Portal',
  description: 'Reach out to EnterURL support for feature requests, business upgrades, or API integration errors.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 flex flex-col justify-start items-center px-4 py-16 relative overflow-hidden dots-bg font-sans select-text">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-600/5 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/70 border border-zinc-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 space-y-8 animate-scale-up-in">
        
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
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">Contact Us</h1>
          <p className="text-xs text-violet-650 uppercase tracking-widest font-extrabold flex items-center gap-1">
            <Mail size={12} />
            Support & Collaboration
          </p>
        </div>

        {/* Content Card */}
        <div className="text-zinc-650 text-xs sm:text-sm font-light leading-relaxed space-y-5">
          <p>
            Have feedback, feature suggestions, or custom integration queries? We are here to support your team.
          </p>

          <div className="space-y-3.5 pt-2 select-none">
            {/* Primary Contact Info */}
            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-150 p-4 rounded-2xl">
              <span className="h-9 w-9 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100/50 shadow-sm shrink-0">
                <Mail size={16} />
              </span>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Email Support</span>
                <a 
                  href="mailto:shashank8808108802@gmail.com"
                  className="text-xs font-mono font-semibold text-zinc-800 hover:text-violet-650 hover:underline select-all"
                >
                  shashank8808108802@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-150 p-4 rounded-2xl">
              <span className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50 shadow-sm shrink-0">
                <MessageSquare size={16} />
              </span>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">GitHub / Developer</span>
                <span className="text-xs font-semibold text-zinc-800">
                  @apnashashank developer
                </span>
              </div>
            </div>
          </div>

          <p className="pt-2">
            For bug reports, please describe the exact platform link (e.g. YouTube Short or Instagram Reel URL) that caused extraction failure to help us trace coordinates or update download libraries quickly.
          </p>
        </div>

        {/* Direct Mail Trigger Button */}
        <a 
          href="mailto:shashank8808108802@gmail.com?subject=EnterURL Portal Support & Feedback Inquiry"
          className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 border-0 select-none cursor-pointer"
        >
          <Send size={13} />
          <span>Launch Mail Client</span>
        </a>

      </div>

      <footer className="mt-8 text-[10px] tracking-widest text-zinc-400 font-light select-none text-center">
        ENTERURL @2026
      </footer>
    </div>
  );
}
