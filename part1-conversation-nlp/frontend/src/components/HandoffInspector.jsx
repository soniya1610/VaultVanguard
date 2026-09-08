import React from 'react';
import { Terminal, ShieldCheck, Copy, Check } from 'lucide-react';

export default function HandoffInspector({ passportReceipts, activeTransaction }) {
  const [copied, setCopied] = React.useState(false);

  const latestReceipt = passportReceipts[passportReceipts.length - 1];

  const handleCopy = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm">Part 2 Handoff Inspector</h3>
        </div>
        <span className="text-[10px] font-mono uppercase bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-300">
          POST /api/passport/create
        </span>
      </div>

      {latestReceipt ? (
        <div className="flex-1 flex flex-col space-y-3 min-h-0">
          <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
            <div>
              <div className="text-xs text-slate-400">Passport Created</div>
              <div className="font-mono text-sm font-bold text-emerald-300">
                {latestReceipt.passport_id}
              </div>
            </div>
            <button
              onClick={() => handleCopy(latestReceipt.payload_received)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs flex items-center space-x-1 transition-all cursor-pointer"
              title="Copy JSON Payload"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-y-auto font-mono text-xs text-emerald-400 space-y-1">
            <div className="text-slate-500 text-[11px] mb-1">// Raw Payload Handoff JSON to Part 2:</div>
            <pre className="whitespace-pre-wrap break-all text-slate-200">
              {JSON.stringify(latestReceipt.payload_received, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2 text-center p-6">
          <ShieldCheck className="w-10 h-10 text-slate-700" />
          <p className="text-xs">No Passport Handoff Triggered Yet.</p>
          <p className="text-[11px] text-slate-600 max-w-xs">
            Confirm a transaction as both Arjun & Riya to witness the structured payload POSTed to Part 2.
          </p>
        </div>
      )}
    </div>
  );
}
