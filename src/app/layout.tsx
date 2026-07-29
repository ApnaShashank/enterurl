import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnterURL - Insta Save, YT Save, Video to Caption & Link Analyzer",
  description: "EnterURL is the ultimate utility: Insta Save for Instagram reels, YT Save for YouTube videos/shorts, Video to Caption generator, SSL checker, and link security audits.",
  metadataBase: new URL('https://enterurl.vercel.app'),
  keywords: [
    "enterurl", 
    "insta save", 
    "yt save", 
    "video to caption", 
    "instagram save", 
    "youtube save", 
    "instagram reels downloader", 
    "youtube shorts downloader", 
    "video to subtitles", 
    "hinglish transcript generator",
    "link analyzer", 
    "website intelligence", 
    "media downloader", 
    "SSL checker", 
    "technology scanner", 
    "SEO audit", 
    "apnashashank developer"
  ],
  icons: {
    icon: [
      { url: "https://ik.imagekit.io/DEMOPROJECT/iconenterurl.png", type: "image/png" }
    ],
    apple: "https://ik.imagekit.io/DEMOPROJECT/iconenterurl.png",
  },
  openGraph: {
    title: "EnterURL - Insta Save, YT Save, Video to Caption & Link Analyzer",
    description: "All-in-one link intelligence tool. Instantly run Insta Save, YT Save, Video to Caption transcripts, SSL checker, and security scans.",
    url: "https://enterurl.vercel.app",
    siteName: "EnterURL",
    images: [
      {
        url: "https://ik.imagekit.io/DEMOPROJECT/iconenterurl.png",
        width: 512,
        height: 512,
        alt: "EnterURL Logo",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EnterURL - Insta Save, YT Save, Video to Caption & Link Analyzer",
    description: "Instantly run Insta Save, YT Save, Video to Caption transcripts, SSL checker, and security scans.",
    images: ["https://ik.imagekit.io/DEMOPROJECT/iconenterurl.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "EnterURL",
    "url": "https://enterurl.vercel.app",
    "description": "All-in-one utility tool for link analysis, website intelligence, instagram media saving (Insta Save), youtube downloader (YT Save), and AI video-to-caption transcription.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Insta Save (Instagram Downloader)",
      "YT Save (YouTube Downloader)",
      "Video to Caption (AI Subtitle Generator)",
      "Website Technology Scanner",
      "SSL Certificate Inspector",
      "VirusTotal Security Scanner",
      "Live Web Screenshots"
    ]
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Fonts for caption presets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700;800&family=Orbitron:wght@400;700;900&family=Playfair+Display:ital,wght@0,700;1,700&family=Permanent+Marker&family=Cinzel:wght@400;700&family=Share+Tech+Mono&family=Exo+2:wght@400;700;800&family=Oswald:wght@400;700&family=Rajdhani:wght@400;600;700&family=Caveat:wght@700&family=Teko:wght@400;600&family=Space+Mono:wght@400;700&family=Nunito:wght@400;700;800&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      </body>
    </html>
  );
}

