import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinTech Hub | Architectural Patterns & Vikas Sahani Portfolio",
  description: "A technical repository of distributed financial architectures, fund-flow patterns, and regulatory-compliant ledger designs curated by Vikas Sahani.",
  keywords: ["FinTech", "Architecture", "Payments", "RBI", "NPCI", "System Design", "Vikas Sahani", "India", "Distributed Systems"],
  authors: [{ name: "Vikas Sahani" }],
  openGraph: {
    title: "FinTech Hub | Architectural Patterns",
    description: "Deep-dive into technical documentation of distributed financial systems.",
    url: "https://VIKAS9793.github.io/FinTech-Hub",
    siteName: "FinTech Hub",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinTech Hub | Architectural Patterns",
    description: "Technical repository of distributed financial architectures.",
    creator: "@VikasSahani",
  },
  robots: "index, follow",
};

export const viewport = {
  themeColor: '#05070A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full selection:bg-primary/30 selection:text-primary" suppressHydrationWarning>
        <div className="grid-bg fixed inset-0 -z-10" />
        
        {/* Global M3E Navigation Header */}
        <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5 px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-display font-black tracking-[-0.05em] text-white hover:text-purple-400 transition-colors uppercase">
              FinTech Hub
            </Link>
            <div className="flex items-center gap-10">
              <Link href="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">
                Archive
              </Link>
              <Link href="/cases" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">
                Case Studies
              </Link>
              <Link href="/disclaimer" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">
                Compliance
              </Link>
              <Link 
                href="https://github.com/VIKAS9793/FinTech-Hub" 
                target="_blank"
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-purple-500 transition-all"
              >
                Repo
              </Link>
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="mt-64 border-t border-white/5 bg-black py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/[0.01] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-20">
              <div className="space-y-8 max-w-md">
                <h3 className="text-2xl font-display font-black tracking-[-0.05em] text-white uppercase">FINTECH HUB</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-light">
                  A technical repository documenting distributed state machines, 
                  nodal fund flows, and financial system resilience patterns.
                </p>
                <div className="pt-4">
                  <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black">
                    © 2026 Vikas Sahani • Documentation Archive
                  </p>
                </div>
              </div>

              <div className="space-y-16">
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Reference Frameworks</h4>
                  <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-lg">
                    {[
                      { src: '/npci_3d.png', alt: 'NPCI', href: 'https://www.npci.org.in/' },
                      { src: '/razorpay_3d.png', alt: 'Razorpay', href: 'https://razorpay.com/' },
                      { src: '/rbi_3d.png', alt: 'RBI', href: 'https://www.rbi.org.in/' },
                      { src: '/paytm_3d.png', alt: 'Paytm', href: 'https://paytm.com/' }
                    ].map((logo, i) => (
                      <a 
                        key={i} 
                        href={logo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100 group/logo hover:border-purple-500/30 hover:bg-purple-500/5"
                      >
                        <Image 
                          src={logo.src} 
                          alt={logo.alt} 
                          width={60}
                          height={60}
                          className="object-contain w-full h-full transition-transform group-hover/logo:scale-110"
                        />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="max-w-xl p-10 rounded-[3rem] bg-purple-500/[0.02] border border-purple-500/10 relative group transition-all hover:bg-purple-500/[0.04]">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500/20 group-hover:bg-purple-500/40 transition-colors" />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-light tracking-wide">
                    <span className="font-black text-slate-400 uppercase tracking-widest mr-2">Technical Disclaimer:</span>
                    All respective logos and organizational identifiers are trademarks of their respective owners. 
                    This repository is an independent technical archive and is not affiliated with any mentioned entity. 
                    The materials presented are theoretical architectural constructs designed to explain 
                    distributed system principles and regulatory compliance logic in a neutral environment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
