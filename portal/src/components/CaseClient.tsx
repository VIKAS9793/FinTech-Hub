"use client";

import React, { useState } from 'react';
import { Activity, ShieldCheck, X } from 'lucide-react';
import Simulator from '@/components/Simulator';

interface CaseClientProps {
  caseId: string;
}

export default function CaseClient({ caseId }: CaseClientProps) {
  const [showSimulator, setShowSimulator] = useState(false);

  return (
    <>
      <div className="glass-card rounded-3xl p-8 sticky top-24">
        <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Interactive Logic
        </h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Execute this architectural state machine in a controlled sandbox to observe real-time ledger transitions and state synchronization across distributed actors.
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200 block">Regulatory Compliance</span>
              <p className="text-slate-500">Validation against standard RBI nodal fund-flow boundaries and PSS requirements.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowSimulator(true)}
          className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          Launch Simulator
        </button>
      </div>

      {/* Simulator Overlay */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden relative">
            <button 
              onClick={() => setShowSimulator(false)}
              className="absolute top-6 right-6 z-[60] p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <Simulator caseId={caseId} />
          </div>
        </div>
      )}
    </>
  );
}
