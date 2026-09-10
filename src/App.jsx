import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MessageSquare,
  FileCheck2,
  Zap,
  LayoutDashboard,
  PlayCircle,
  RotateCcw,
  Menu,
  X,
  ExternalLink,
  Wifi,
  Sparkles,
} from 'lucide-react';
import Part1View from './views/Part1View.jsx';
import Part2View from './views/Part2View.jsx';
import Part3View from './views/Part3View.jsx';
import Part4View from './views/Part4View.jsx';
import JourneyView from './views/JourneyView.jsx';
import { trustbridgeEngine } from './services/trustbridgeEngine.js';

export default function App() {
  const getInitialPart = () => {
    const hash = window.location.hash.replace('#/', '').toLowerCase();
    if (['part1', 'part2', 'part3', 'part4', 'journey'].includes(hash)) {
      return hash;
    }
    return 'part3'; // Default to Part 3 (Payment & Reconciliation engine)
  };

  const [activePart, setActivePart] = useState(getInitialPart);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [engineState, setEngineState] = useState(trustbridgeEngine.state);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').toLowerCase();
      if (['part1', 'part2', 'part3', 'part4', 'journey'].includes(hash)) {
        setActivePart(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const unsub = trustbridgeEngine.subscribe((st) => setEngineState(st));
    return () => unsub();
  }, []);

  const navigateTo = (part) => {
    setActivePart(part);
    window.location.hash = `#/${part}`;
    setMobileMenuOpen(false);
  };

  const handleGlobalSeed = async () => {
    await trustbridgeEngine.seedDefaultState();
  };

  const handleGlobalReset = () => {
    trustbridgeEngine.resetAll();
  };

  const latestPassport = engineState.passports[engineState.passports.length - 1];
  const currentState = latestPassport?.state || 'IDLE';

  const navItems = [
    {
      id: 'part1',
      label: 'Part 1: Chat & Consent',
      port: ':5173',
      icon: MessageSquare,
      color: 'indigo',
    },
    {
      id: 'part2',
      label: 'Part 2: Passport & State',
      port: ':5175',
      icon: FileCheck2,
      color: 'purple',
    },
    {
      id: 'part3',
      label: 'Part 3: Payment & Reconcile',
      port: ':5174',
      icon: Zap,
      color: 'amber',
    },
    {
      id: 'part4',
      label: 'Part 4: Merchant & Dispute',
      port: ':5176',
      icon: LayoutDashboard,
      color: 'emerald',
    },
    {
      id: 'journey',
      label: 'End-to-End Story Journey',
      port: 'Story',
      icon: PlayCircle,
      color: 'sky',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── Monorepo Top Ecosystem Switcher Bar ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] sticky top-0 z-50">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-slate-500 font-bold shrink-0">TrustBridge Monorepo:</span>
          {navItems.map((item) => {
            const isActive = activePart === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`px-2.5 py-0.5 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.label} ({item.port}) {isActive ? '[Active]' : ''}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-semibold text-[10px]">Client Engine Live</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[10px]">
            Lifecycle: <strong className="text-amber-400 font-mono">{currentState}</strong>
          </span>
        </div>
      </div>

      {/* ── Master Brand Header ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-[33px] z-40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-950/60">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">TrustBridge</h1>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
                VaultVanguard
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Autonomous Financial Layer · Natural Language to Verified Reconciled Settlement
            </p>
          </div>
        </div>

        {/* Global Controls & Mobile Menu Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleGlobalSeed}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
            title="Preload Arjun & Riya ₹250 Tea Repayment Demo Data"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Seed Demo Data</span>
            <span className="sm:hidden">Seed</span>
          </button>

          <button
            onClick={handleGlobalReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            title="Reset All Local State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Navigation Dropdown ── */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2 z-40">
          <span className="text-[10px] uppercase font-bold text-slate-500">Switch Microservice:</span>
          {navItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activePart === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ItemIcon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] opacity-75">{item.port}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Application Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activePart === 'part1' && <Part1View onNavigatePart={navigateTo} />}
        {activePart === 'part2' && <Part2View onNavigatePart={navigateTo} />}
        {activePart === 'part3' && <Part3View onNavigatePart={navigateTo} />}
        {activePart === 'part4' && <Part4View onNavigatePart={navigateTo} />}
        {activePart === 'journey' && <JourneyView onNavigatePart={navigateTo} />}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>TrustBridge Autonomous Financial Infrastructure</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">GitHub Pages Production Ready</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Passports: <strong className="text-slate-300">{engineState.passports.length}</strong> · 
            Settlements: <strong className="text-slate-300">{engineState.settlements.length}</strong> · 
            Disputes: <strong className="text-slate-300">{engineState.disputes.length}</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
