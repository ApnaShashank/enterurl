import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Globe, Cpu, Download, Video, Camera, Music, FileText } from 'lucide-react';

export const metadata = {
  title: 'About EnterURL - Advanced Link & Website Intelligence Analyzer',
  description: 'Learn about EnterURL, a link scanner and website intelligence analyzer built by Shashank Gupta that extracts metadata, checks safety, and details platform URL rules.',
};

export default function AboutPage() {
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
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none">About EnterURL</h1>
          <p className="text-xs text-violet-650 uppercase tracking-widest font-extrabold">
            Advanced Link & Website Intelligence • Designed & Created by Shashank Gupta
          </p>
        </div>

        {/* Editorial Text content */}
        <div className="text-zinc-650 text-xs sm:text-sm font-light leading-relaxed space-y-6">
          <p>
            EnterURL is an intelligence portal built to parse, scan, and extract variables from any web URL or media resource in seconds. Engineered for developers, content creators, and safety analysts, it checks platform assets dynamically.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 select-none">
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-black text-violet-600">100%</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Web URL Support</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-black text-violet-600">35+</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Media Networks</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 text-center">
              <span className="block text-2xl font-black text-violet-600">100+</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Formats Parsed</span>
            </div>
          </div>

          {/* Supported Platforms Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider select-none flex items-center gap-1.5 border-b border-zinc-200/60 pb-2">
              Supported Platforms & Formats
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* HTTP / HTTPS Custom URL Compatibility */}
              <div className="space-y-1.5 sm:col-span-2 bg-violet-50/20 border border-violet-100/30 p-3 rounded-2xl">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 select-none">
                  <Globe size={13} className="text-violet-600" />
                  <span>🌐 Any Web URL / Protocol</span>
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-light pl-5">
                  Input <strong>any website domain</strong> using HTTP or HTTPS protocols. EnterURL runs deep SEO validation, parses metadata (OpenGraph/Twitter tags), extracts code stacks and technology components, validates SSL certificate configurations, analyses robots.txt structure, maps XML Sitemap indexes, checks VirusTotal security metrics, and takes instant browser screenshots.
                </p>
              </div>

              {/* Video Platforms */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 select-none">
                  <Video size={13} className="text-violet-600" />
                  <span>🎥 Video Platforms</span>
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-light pl-5">
                  <strong>YouTube</strong> (Videos, Shorts, Playlists, Channels), <strong>Vimeo</strong>, <strong>TikTok</strong>, <strong>Dailymotion</strong>, <strong>Twitch</strong>, <strong>Loom</strong>, <strong>Wistia</strong>, <strong>Brightcove</strong>, and <strong>JWPlayer</strong>.
                </p>
              </div>

              {/* Social Media */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 select-none">
                  <Camera size={13} className="text-violet-600" />
                  <span>📸 Social Networks</span>
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-light pl-5">
                  <strong>Instagram</strong> (Posts, Reels, Carousels, Profiles), <strong>Facebook</strong> (Posts, Videos), <strong>X (Twitter)</strong> (Tweets, Media), <strong>Threads</strong>, <strong>Reddit</strong>, <strong>Pinterest</strong>, <strong>LinkedIn</strong>, and <strong>Snapchat</strong>.
                </p>
              </div>

              {/* Music Platforms */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 select-none">
                  <Music size={13} className="text-violet-600" />
                  <span>🎵 Music Platforms</span>
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-light pl-5">
                  <strong>Spotify</strong> (Tracks, Albums, Playlists, Artists), <strong>SoundCloud</strong>, <strong>Apple Music</strong>, <strong>Deezer</strong>, <strong>Audiomack</strong>, and <strong>Mixcloud</strong>.
                </p>
              </div>

              {/* Documents & Files */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 select-none">
                  <FileText size={13} className="text-violet-600" />
                  <span>📄 Documents & Images</span>
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-light pl-5">
                  <strong>Documents:</strong> PDF, DOCX, PPTX, XLSX, TXT, CSV, Markdown, RTF, and EPUB. <br />
                  <strong>Images:</strong> JPG, PNG, WEBP, GIF, SVG, AVIF, HEIC, and ICO files.
                </p>
              </div>
            </div>
          </div>

          {/* Creator Showcase Card */}
          <div className="bg-gradient-to-br from-violet-50/50 to-fuchsia-50/30 border border-violet-100 rounded-2xl p-5 sm:p-6 space-y-4 select-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-violet-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                SG
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Shashank Gupta</h3>
                <p className="text-[10px] text-zinc-400 font-light">Full-Stack Developer & Creator of EnterURL</p>
              </div>
            </div>
            <p className="text-zinc-650 text-xs font-light leading-relaxed">
              EnterURL was designed and built by <strong>Shashank Gupta</strong> as an advanced, responsive dashboard to perform instant web audit intelligence and media extraction. Check out my engineering projects, design layouts, and technical portfolios at my portfolio:
            </p>
            <div className="pt-1">
              <a 
                href="https://shashankqoder.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold rounded-xl text-xs transition-all shadow-md hover:scale-[1.02] cursor-pointer"
              >
                <span>shashankqoder.vercel.app</span>
                <ArrowLeft className="rotate-180" size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer info inside the card */}
        <div className="border-t border-zinc-200/60 pt-6 text-[10px] text-zinc-400 flex flex-col sm:flex-row justify-between gap-2 select-none font-medium">
          <span>Enterprise Link Analytics</span>
          <span className="text-zinc-500">
            Created by{' '}
            <a href="https://shashankqoder.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-zinc-600">
              Shashank Gupta
            </a>
          </span>
        </div>

      </div>

      <footer className="mt-8 text-[10px] tracking-widest text-zinc-400 font-light select-none text-center space-y-1">
        <p>ENTERURL @2026</p>
      </footer>
    </div>
  );
}
