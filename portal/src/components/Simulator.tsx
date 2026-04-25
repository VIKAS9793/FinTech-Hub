"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Wallet, 
  ArrowRightLeft, 
  RotateCcw,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { CASE_SCENARIOS, LedgerEntry } from '@/lib/scenarios';

interface SimulatorProps {
  caseId: string;
}

export default function Simulator({ caseId }: SimulatorProps) {
  const scenarioConfig = CASE_SCENARIOS[caseId] || CASE_SCENARIOS["01"];
  
  const [balances, setBalances] = useState<Record<string, number>>(scenarioConfig.initialBalances);
  const [logs, setLogs] = useState<LedgerEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState<number | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const addLog = useCallback((message: string, type: LedgerEntry['type'] = 'INFO', amount?: number) => {
    const newEntry: LedgerEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      amount,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newEntry, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    addLog(`System initialized for ${scenarioConfig.title}.`, 'SYSTEM');
  }, [scenarioConfig, addLog]);

  if (!isMounted) return null;

  const reset = () => {
    setBalances(scenarioConfig.initialBalances);
    setLogs([]);
    setCurrentScenarioIdx(null);
    setCurrentStepIdx(0);
    setIsProcessing(false);
    addLog("State machine reset to initial parameters.", "SYSTEM");
  };

  const runStep = async (scenarioIdx: number) => {
    const scenario = scenarioConfig.scenarios[scenarioIdx];
    if (currentScenarioIdx !== scenarioIdx) {
      setCurrentScenarioIdx(scenarioIdx);
      setCurrentStepIdx(0);
    }

    const stepIdx = currentScenarioIdx === scenarioIdx ? currentStepIdx : 0;
    const step = scenario.steps[stepIdx];

    if (!step) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Perceptual delay for architectural clarity
    
    await step.action(setBalances, addLog);
    
    setCurrentStepIdx(prev => prev + 1);
    setIsProcessing(false);
  };

  return (
    <div className="bg-black border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] relative">
      <div className="absolute inset-0 bg-purple-500/[0.01] pointer-events-none" />
      
      {/* Header */}
      <div className="p-10 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-xl font-display font-black tracking-tight text-white">Ledger State Diagnostic</h2>
          </div>
          <p className="text-slate-500 text-xs font-light tracking-widest uppercase">
            Analyzing: {scenarioConfig.title}
          </p>
        </div>
        <button 
          onClick={reset}
          className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-slate-500 hover:text-white"
          title="Reset Simulation"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Accounts Grid */}
        <div className="lg:w-3/5 p-10 overflow-y-auto custom-scrollbar border-r border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(balances).map(([name, amount]) => (
              <motion.div 
                key={name}
                layout
                className="glass-card p-8 rounded-[2rem] border-white/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20 group-hover:bg-purple-500/40 transition-colors" />
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 rounded-2xl bg-white/5 text-slate-500 group-hover:text-purple-400 transition-colors">
                    <Wallet className="w-5 h-5 font-light" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Vault</span>
                </div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{name.replace('_', ' ')}</h3>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={amount}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-black text-white"
                  >
                    ₹{amount.toLocaleString()}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
              <Activity className="w-4 h-4 text-purple-500" /> Diagnostic Scenarios
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {scenarioConfig.scenarios.map((scenario, idx) => {
                const isCurrent = currentScenarioIdx === idx;
                const isComplete = isCurrent && currentStepIdx >= scenario.steps.length;
                
                return (
                  <button
                    key={idx}
                    disabled={isProcessing || isComplete}
                    onClick={() => runStep(idx)}
                    className={`
                      w-full p-8 rounded-[2.5rem] border transition-all flex items-center justify-between text-left group
                      ${isComplete 
                        ? 'bg-emerald-500/[0.02] border-emerald-500/20 opacity-60' 
                        : isCurrent
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-white/[0.02] border-white/5 hover:border-purple-500/20 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <div className="space-y-2">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${isComplete ? 'text-emerald-500' : 'text-purple-400'}`}>
                        {isComplete ? 'Resolved' : `Sequence 0${idx + 1}`}
                      </span>
                      <span className="text-xl font-display font-black text-white">
                        {isCurrent && !isComplete ? scenario.steps[currentStepIdx].label : scenario.label}
                      </span>
                    </div>
                    <div className={`
                      p-4 rounded-2xl transition-all
                      ${isComplete ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-500 group-hover:text-purple-400 group-hover:bg-purple-500/10'}
                    `}>
                      {isComplete ? <CheckCircle2 className="w-6 h-6" /> : <ArrowRightLeft className="w-6 h-6" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Ledger Logs */}
        <div className="lg:w-2/5 flex flex-col bg-black/40 backdrop-blur-3xl">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <History className="w-4 h-4 text-slate-600" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Immutable Ledger</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            <AnimatePresence initial={false}>
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6 opacity-30">
                  <Activity className="w-16 h-16 stroke-[0.5]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Telemetry</p>
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-3 group hover:bg-white/[0.02] transition-colors relative"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          log.type === 'SUCCESS' ? 'bg-emerald-500' : 
                          log.type === 'ERROR' ? 'bg-rose-500' : 
                          log.type === 'SYSTEM' ? 'bg-slate-700' : 'bg-purple-500'
                        }`} />
                        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">{log.timestamp}</span>
                      </div>
                      {log.amount && (
                        <span className="text-xs font-black text-purple-400">₹{log.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                      {log.message}
                    </p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
