import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import PassportTimeline from '../../part2-transaction-passport/frontend/src/components/PassportTimeline.jsx';
import CryptographicAudit from '../../part2-transaction-passport/frontend/src/components/CryptographicAudit.jsx';
import UPILauncher from '../../part2-transaction-passport/frontend/src/components/UPILauncher.jsx';
import { p2Api } from '../services/apiAdapter.js';
import { trustbridgeEngine } from '../services/trustbridgeEngine.js';

export default function Part2View({ onNavigatePart }) {
  const [passports, setPassports] = useState([]);
  const [selectedPassportId, setSelectedPassportId] = useState(null);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await p2Api.fetchPassports();
      const list = res.passports || [];
      setPassports(list);

      if (list.length > 0) {
        const currentId = selectedPassportId || list[list.length - 1].passport_id;
        setSelectedPassportId(currentId);
        const detail = await p2Api.fetchPassport(currentId).catch(() => null);
        if (detail) setSelectedPassport(detail.passport);
      } else {
        setSelectedPassportId(null);
        setSelectedPassport(null);
      }
    } catch (err) {
      console.error('Part 2 loadData error:', err);
    }
  }, [selectedPassportId]);

  useEffect(() => {
    loadData();
    const unsubscribe = trustbridgeEngine.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleSelectPassport = async (pid) => {
    setSelectedPassportId(pid);
    try {
      const detail = await p2Api.fetchPassport(pid);
      setSelectedPassport(detail.passport);
    } catch (err) {
      showToast(`Failed to load passport ${pid}`, 'error');
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await p2Api.seedDemo();
      await loadData();
      showToast('✓ Demo Passport Seeded', 'success');
    } catch (err) {
      showToast('Error seeding demo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await p2Api.resetDemo();
      await loadData();
      showToast('Passport ledger reset', 'info');
    } catch (err) {
      showToast('Error resetting', 'error');
    }
  };

  const handlePaymentTriggered = (res) => {
    showToast(`Payment initiated: ${res.payment_reference}. Visible contradiction active!`, 'success');
    loadData();
    if (onNavigatePart) {
      // Prompt option to switch to Part 3
    }
  };

  return (
    <div className="flex flex-col space-y-5">
      {/* Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold text-slate-200">Transaction Passport Authority</span>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
            {passports.length} Passports Minted
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Seed Demo Passport</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`p-3 rounded-lg text-xs font-semibold shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-950 border border-emerald-600 text-emerald-200' : 'bg-slate-800 border border-slate-700 text-slate-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Passports Selector Bar */}
      {passports.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0">Select Passport:</span>
          {passports.map((p) => {
            const active = p.passport_id === selectedPassportId;
            return (
              <button
                key={p.passport_id}
                onClick={() => handleSelectPassport(p.passport_id)}
                className={`px-3 py-1 rounded font-mono font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {p.passport_id} ({p.state})
              </button>
            );
          })}
        </div>
      )}

      {selectedPassport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Passport Details & Crypto Proof */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Official Transaction Passport
                  </span>
                  <h2 className="text-xl font-bold font-mono text-slate-100 mt-0.5">
                    {selectedPassport.passport_id}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Minted: {new Date(selectedPassport.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      selectedPassport.state === 'SETTLED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}
                  >
                    {selectedPassport.state}
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    ₹{Number(selectedPassport.amount).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Participants & Purpose */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Payer</span>
                  <p className="font-semibold text-indigo-300">{selectedPassport.payer}</p>
                  <span className="text-[10px] text-emerald-400">Confirmed ✓</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Receiver</span>
                  <p className="font-semibold text-emerald-300">{selectedPassport.receiver}</p>
                  <span className="text-[10px] text-emerald-400">Confirmed ✓</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Purpose</span>
                  <p className="font-semibold text-slate-200 capitalize">{selectedPassport.purpose}</p>
                  <span className="text-[10px] text-slate-400">Verified</span>
                </div>
              </div>

              {/* Cross service navigation hints */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                <span className="text-slate-400">Next step in lifecycle:</span>
                <button
                  onClick={() => onNavigatePart && onNavigatePart('part3')}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Execute in Part 3 (Payment & Reconcile)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* UPI Launcher */}
            <UPILauncher
              passport={selectedPassport}
              onPaymentTriggered={handlePaymentTriggered}
            />

            {/* Cryptographic SHA-256 Audit */}
            <CryptographicAudit passport={selectedPassport} />
          </div>

          {/* Right Column: Complete Lifecycle Timeline */}
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-200">
                Transaction Passport Timeline & Audit Trail
              </h3>
            </div>
            <PassportTimeline timeline={selectedPassport.timeline || []} />
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-slate-400">
          <p className="text-sm font-semibold mb-2">No Transaction Passports Minted Yet</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Go to Part 1 to chat and confirm an obligation, or click "Seed Demo Passport" to generate one instantly.
          </p>
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all"
          >
            Seed Demo Passport
          </button>
        </div>
      )}
    </div>
  );
}
