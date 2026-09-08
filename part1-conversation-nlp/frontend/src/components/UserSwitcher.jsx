import React from 'react';
import { User, Users, RefreshCw, Play, FileText, ShieldCheck } from 'lucide-react';

export default function UserSwitcher({
  activeUser,
  setActiveUser,
  isSplitView,
  setIsSplitView,
  onResetChat,
  onSeedDemo,
  onOpenRejectedModal,
  rejectedCount,
}) {
  return (
    <div className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 px-4 py-3 sticky top-0 z-20 shadow-lg flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-950/50">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base text-slate-100 tracking-tight">TrustBridge</h1>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Part 1: NLP & Consent
            </span>
          </div>
          <p className="text-xs text-slate-400">Arjun & Riya Conversation Stream</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 flex items-center space-x-1 shadow-inner">
          <button
            onClick={() => setActiveUser('Arjun')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeUser === 'Arjun' && !isSplitView
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Arjun</span>
          </button>
          <button
            onClick={() => setActiveUser('Riya')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeUser === 'Riya' && !isSplitView
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Riya</span>
          </button>
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
              isSplitView
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Dual View Mode for Judging Demos"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onSeedDemo}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Load Hackathon Demo Script Sequence"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Load Demo Script</span>
          </button>

          <button
            onClick={onOpenRejectedModal}
            className="px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer"
            title="View Rejected/Dismissed Detections Log"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit ({rejectedCount})</span>
          </button>

          <button
            onClick={onResetChat}
            className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-600 rounded-lg transition-all cursor-pointer"
            title="Clear Chat Memory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
