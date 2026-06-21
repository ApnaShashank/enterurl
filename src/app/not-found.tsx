'use client';

import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 flex flex-col justify-center items-center px-4 relative overflow-hidden dots-bg font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-violet-600/5 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/70 border border-zinc-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 text-center select-none animate-scale-up-in">
        <div className="h-16 w-16 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-center text-violet-650 mx-auto mb-6 shadow-sm">
          <HelpCircle size={32} className="stroke-[1.75]" />
        </div>

        <h1 className="text-7xl font-black text-zinc-900 tracking-tight leading-none mb-2">404</h1>
        <h2 className="text-lg font-bold text-zinc-850 tracking-tight uppercase mb-3">Page Not Found</h2>
        <p className="text-xs text-zinc-450 font-light leading-relaxed max-w-xs mx-auto mb-8">
          The link you followed might be broken, or the page may have been removed. Let's get you back on track.
        </p>

        <Link 
          href="/"
          className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-855 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border-0"
        >
          <ArrowLeft size={14} />
          <span>Back to Homepage</span>
        </Link>
      </div>

      {/* Footer copyright */}
      <footer className="absolute bottom-6 text-[10px] tracking-widest text-zinc-400 font-light select-none text-center">
        ENTERURL @2026
      </footer>
    </div>
  );
}
