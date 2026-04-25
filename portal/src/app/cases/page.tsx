import { getAllCases } from '@/lib/cases';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CasesPage() {
  const cases = getAllCases();

  return (
    <div className="max-w-7xl mx-auto px-6 py-48">
      <header className="mb-24 space-y-10">
        <h1 className="text-6xl md:text-9xl font-display font-black leading-[0.9] tracking-[-0.05em] text-white uppercase">
          Case Studies
        </h1>
        <p className="text-xl text-slate-500 font-light leading-relaxed max-w-3xl">
          A technical analysis of distributed financial architectures, 
          exploring state machine transitions and nodal fund boundaries.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {cases.map((cs) => (
          <Link 
            key={cs.slug} 
            href={`/cases/${cs.slug}`}
            className="group block"
          >
            <article className="glass-card rounded-[3rem] p-16 h-full flex flex-col transition-all hover:scale-[1.01] hover:bg-purple-500/[0.03] border-white/5 hover:border-purple-500/20">
              <div className="flex-grow space-y-8">
                <h3 className="text-3xl md:text-4xl font-display font-black text-white leading-tight tracking-tight group-hover:text-purple-400 transition-colors">
                  {cs.title}
                </h3>
                
                <p className="text-base text-slate-500 leading-relaxed font-light line-clamp-3">
                  {cs.coreChallenge || "Technical analysis of complex financial state transitions and regulatory-compliant fund routing."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-16 mt-16 border-t border-white/5">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-purple-300 transition-colors">
                  View Analysis
                </div>
                <div className="p-4 rounded-2xl bg-white/5 text-slate-500 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-all">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
