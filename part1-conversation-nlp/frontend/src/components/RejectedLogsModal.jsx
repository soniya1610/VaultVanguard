import React from 'react';
import { X, ShieldX } from 'lucide-react';

export default function RejectedLogsModal({ isOpen, onClose, rejectedLogs }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldX className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-slate-100">Rejected & Dismissed Detections Audit</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {rejectedLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No rejected or dismissed detections recorded.
            </div>
          ) : (
            rejectedLogs.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-semibold">
                  <span>Reason: {item.reason}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{item.id}</span>
                </div>
                <div className="text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800 overflow-x-auto">
                  <pre>{JSON.stringify(item.detection, null, 2)}</pre>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
