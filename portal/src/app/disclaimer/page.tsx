import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen pt-40 pb-40 relative">
      <div className="max-w-4xl mx-auto px-6">
        <header className="mb-32 space-y-12">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldAlert className="w-4 h-4" />
            Compliance Shield
          </div>
          <h1 className="text-7xl md:text-9xl font-display font-black leading-[0.9] tracking-[-0.05em] text-white">
            Disclaimer
          </h1>
          <p className="text-xl text-slate-500 font-light leading-relaxed max-w-3xl">
            Important legal information regarding architectural patterns, 
            corporate neutrality, and regulatory demonstrative frameworks.
          </p>
        </header>

        <div className="space-y-24">
          <section className="p-16 rounded-[3rem] bg-purple-500/[0.02] border border-purple-500/10 relative overflow-hidden group transition-all hover:bg-purple-500/[0.04]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500/20 group-hover:bg-purple-500/40 transition-colors" />
            <h2 className="text-2xl font-display font-black text-white mb-8 tracking-tight">
              Educational & Portfolio Purpose
            </h2>
            <p className="text-lg text-slate-500 font-light leading-relaxed">
              The case studies, architectural designs, and business scenarios presented on this platform 
              are strictly for educational, demonstrative, and portfolio purposes. They represent theoretical 
              architectures designed independently to demonstrate system design and product management principles.
            </p>
          </section>

          <section className="space-y-20">
            <div className="flex gap-10 group">
              <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                <Info className="w-8 h-8 font-light" />
              </div>
              <div className="space-y-6 pt-2">
                <h3 className="text-xl font-display font-black text-white tracking-tight">Corporate Neutrality</h3>
                <p className="text-lg text-slate-500 font-light leading-relaxed">
                  Any references to real-world companies, financial institutions, payment gateways, or 
                  aggregators—including but not limited to Razorpay, ICICI Bank, SBI, or the National 
                  Payments Corporation of India (NPCI)—are used purely as illustrative examples to explain 
                  industry concepts and regulatory frameworks.
                </p>
              </div>
            </div>

            <div className="flex gap-10 group">
              <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                <Info className="w-8 h-8 font-light" />
              </div>
              <div className="space-y-6 pt-2">
                <h3 className="text-xl font-display font-black text-white tracking-tight">No Affiliation</h3>
                <p className="text-lg text-slate-500 font-light leading-relaxed">
                  I am not affiliated with, sponsored by, or endorsed by any of these organizations. 
                  The technical solutions, state machines, and enterprise sales scenarios described 
                  herein do not represent, expose, or reflect the actual proprietary internal 
                  architectures, codebase, or official solutions of any mentioned entity.
                </p>
              </div>
            </div>

            <div className="flex gap-10 group">
              <div className="flex-shrink-0 w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                <Info className="w-8 h-8 font-light" />
              </div>
              <div className="space-y-6 pt-2">
                <h3 className="text-xl font-display font-black text-white tracking-tight">Generic Placeholder Clause</h3>
                <p className="text-lg text-slate-500 font-light leading-relaxed">
                  All examples, narratives, and code snippets use generic placeholder names 
                  (e.g., &quot;Food Platform&quot;, &quot;Partner Bank&quot;, &quot;Payment Aggregator&quot;). Any resemblance 
                  to actual companies or third-party organizations is purely coincidental.
                </p>
              </div>
            </div>
          </section>

          <footer className="pt-20 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">
              Grounded in RBI Regulatory Frameworks • 2026
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
