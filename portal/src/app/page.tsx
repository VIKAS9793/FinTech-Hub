"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export const dynamic = "force-static";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const word1 = "FINTECH".split("");
  const word2 = "HUB".split("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-32 pb-40 overflow-hidden bg-black">
      {/* Live Background Visuals (Ecosystem Mascots & 3D Artifacts) */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating 3D Ecosystem Artifacts */}
          {[
            { src: "/npci_3d.png", x: "15%", y: "10%", delay: 0 },
            { src: "/razorpay_3d.png", x: "85%", y: "20%", delay: 2 },
            { src: "/rbi_3d.png", x: "10%", y: "80%", delay: 4 },
            { src: "/paytm_3d.png", x: "90%", y: "70%", delay: 6 }
          ].map((logo, i) => (
            <motion.div
              key={`artifact-${i}`}
              initial={{ x: logo.x, y: logo.y, opacity: 0, scale: 0.5, rotateY: 45 }}
              animate={{ 
                y: [logo.y, (parseInt(logo.y) + 5) + "%", logo.y],
                opacity: 0.35,
                scale: 1,
                rotateY: [45, 60, 45],
                rotateX: [0, 15, 0]
              }}
              transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut", delay: logo.delay }}
              className="absolute w-64 h-64 grayscale blur-[2px] hover:grayscale-0 transition-all"
            >
              <Image 
                src={logo.src} 
                alt="Ecosystem Node" 
                width={256}
                height={256}
                priority={i < 2}
                className="w-full h-full object-contain" 
              />
            </motion.div>
          ))}

          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`mascot-${i}`}
              initial={{ 
                x: i === 0 ? "5%" : "85%", 
                y: i === 0 ? "45%" : "35%",
                opacity: 0,
                scale: 0.8
              }}
              animate={{ 
                y: i === 0 ? ["45%", "50%", "45%"] : ["35%", "30%", "35%"],
                opacity: 0.25,
                scale: 1,
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 12 + i * 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute w-96 h-96"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full text-purple-500/20">
                <circle cx="100" cy="75" r="45" fill="currentColor" />
                <path d="M60 155 Q100 115 140 155" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" />
                <rect x="75" y="65" width="50" height="20" rx="10" fill="white/10" />
                <circle cx="100" cy="75" r="60" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.1" className="animate-ping" />
              </svg>
            </motion.div>
          ))}
          
          {/* Animated Connecting Nodes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`node-${i}`}
              initial={{ x: (i * 12) + "%", y: "0%", opacity: 0 }}
              animate={{ y: "100%", opacity: [0, 0.2, 0] }}
              transition={{ duration: 15 + i, repeat: Infinity, ease: "linear", delay: i * 2 }}
              className="absolute w-[1px] h-20 bg-gradient-to-b from-transparent via-purple-500 to-transparent"
            />
          ))}
        </div>
      )}

      <section className="relative z-10 text-center space-y-16 max-w-7xl">
        <div className="space-y-6">
          {/* Row 1: FINTECH */}
          <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-4 whitespace-nowrap overflow-visible">
            {word1.map((char, i) => (
              <motion.span
                key={`w1-${i}`}
                initial={{ opacity: 0, y: 100, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.05,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                className="text-[clamp(3.5rem,15vw,11rem)] font-display font-black leading-[0.8] tracking-tighter text-white
                  hover:text-purple-400 transition-all cursor-default select-none
                  drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] 
                  drop-shadow-[0_15px_30px_rgba(168,85,247,0.6)]"
                style={{
                  textShadow: "0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2)",
                  willChange: "transform, opacity"
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Row 2: HUB */}
          <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-4 whitespace-nowrap overflow-visible">
            {word2.map((char, i) => (
              <motion.span
                key={`w2-${i}`}
                initial={{ opacity: 0, y: 100, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: (word1.length + i) * 0.05,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                className="text-[clamp(3.5rem,15vw,11rem)] font-display font-black leading-[0.8] tracking-tighter text-white
                  hover:text-purple-400 transition-all cursor-default select-none
                  drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] 
                  drop-shadow-[0_15px_30px_rgba(168,85,247,0.6)]"
                style={{
                  textShadow: "0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2)",
                  willChange: "transform, opacity"
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="space-y-10"
        >
          <h2 className="text-lg md:text-2xl font-display font-light text-slate-400 tracking-[0.4em] uppercase px-6">
            Technical documentation of distributed financial systems.
          </h2>
          <p className="text-xs md:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-light tracking-wide px-8">
            A technical repository of distributed financial architectures and fund-flow patterns. 
            Analyze state transition logic, nodal fund boundaries, and 
            regulatory-compliant ledger designs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12"
        >
          <Link
            href="/cases"
            className="group relative px-12 py-6 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-3xl overflow-hidden transition-all hover:scale-105 active:scale-95 hover:bg-purple-500 hover:text-white"
          >
            View Case Studies
          </Link>
          <Link
            href="https://github.com/VIKAS9793/FinTech-Hub"
            target="_blank"
            className="px-12 py-6 glass border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] rounded-3xl transition-all hover:bg-white/5 active:scale-95"
          >
            Documentation Repo
          </Link>
        </motion.div>
      </section>

      {/* Clinical Feature Grid */}
      <section className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-64 px-4">
        {[
          {
            icon: ShieldCheck,
            title: "Regulatory Context",
            desc: "Technical analysis of financial regulations including PSS Act and DLG guidelines for nodal fund routing.",
          },
          {
            icon: Zap,
            title: "Saga Orchestration",
            desc: "Interactive documentation of distributed transactions, observing ledger states and error recovery mechanisms.",
          },
          {
            icon: BarChart3,
            title: "Ledger Consistency",
            desc: "Analysis of settlement timing and reconciliation logic to ensure high data consistency and operational truth.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 + i * 0.1 }}
            className="glass-card p-12 rounded-[3rem] relative group transition-all hover:bg-purple-500/[0.05]"
          >
            <div className="p-5 rounded-2xl bg-white/5 w-fit mb-10 text-white group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
              <item.icon className="w-8 h-8 font-light" />
            </div>
            <h3 className="text-2xl font-display font-black tracking-tight mb-6 text-white">{item.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-light">{item.desc}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
