import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "EnterURL - Advanced Link & Website Intelligence Analyzer",
  description: "Analyze any link, scrape media, inspect SSL certificates, scan tech stacks, generate screenshots, and run SEO audits instantly on enterurl.vercel.app.",
  metadataBase: new URL('https://enterurl.vercel.app'),
  keywords: ["link analyzer", "website intelligence", "media downloader", "SSL checker", "technology scanner", "SEO audit", "URL preview", "VirusTotal scan"],
  authors: [{ name: "EnterURL Team" }],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" }
    ],
    apple: "/icon.png",
  },
  openGraph: {
    title: "EnterURL - Advanced Link & Website Intelligence Analyzer",
    description: "Analyze any link, scrape media, inspect SSL certificates, scan tech stacks, generate screenshots, and run SEO audits instantly.",
    url: "https://enterurl.vercel.app",
    siteName: "EnterURL",
    images: [
      {
        url: "/icon.png",
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
    title: "EnterURL - Advanced Link & Website Intelligence Analyzer",
    description: "Analyze any link, inspect SSL certificates, scan tech stacks, and generate screenshots instantly.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

