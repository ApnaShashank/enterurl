'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured render error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-800 flex flex-col justify-center items-center px-4 relative overflow-hidden dots-bg font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-112.5 h-112.5 bg-rose-600/5 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/70 border border-zinc-200/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative z-10 text-center animate-scale-up-in select-text">
        <div className="h-16 w-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-sm select-none">
          <AlertTriangle size={32} className="stroke-[1.75]" />
        </div>

        <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-2 select-none">System Glitch</h1>
        <h2 className="text-xs font-bold text-rose-600 tracking-wider uppercase mb-4 select-none">An unexpected error occurred</h2>
        
        <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 text-[10px] text-left text-rose-700 font-mono break-all max-h-35 overflow-y-auto mb-6 scrollbar-thin">
          <span className="font-bold block mb-1">Diagnostic Details:</span>
          {error.message || 'Unknown render failure'}
          {error.digest && (
            <span className="block mt-1 text-zinc-400 text-[9px] font-sans">Digest ID: {error.digest}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => reset()}
            className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border-0 select-none"
          >
            <RefreshCw size={14} className="animate-spin-slow" />
            <span>Try Recovering</span>
          </button>
          <a
            href="/"
            className="flex-1 py-3.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center select-none"
          >
            Go Back Home
          </a>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="absolute bottom-6 text-[10px] tracking-widest text-zinc-400 font-light select-none text-center">
        ENTERURL @2026
      </footer>
    </div>
  );
}
