import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, Zap, AlertCircle, ShieldCheck } from 'lucide-react';
import PassportCard from '../../part3-payment-reconciliation/frontend/src/components/PassportCard.jsx';
import GatewayMerchantPanel from '../../part3-payment-reconciliation/frontend/src/components/GatewayMerchantPanel.jsx';
import ReconciliationPanel from '../../part3-payment-reconciliation/frontend/src/components/ReconciliationPanel.jsx';
import AuditLog from '../../part3-payment-reconciliation/frontend/src/components/AuditLog.jsx';
import StateMachineStepper from '../../part3-payment-reconciliation/frontend/src/components/StateMachineStepper.jsx';
import { p3Api } from '../services/apiAdapter.js';
import { trustbridgeEngine } from '../services/trustbridgeEngine.js';

export default function Part3View({ onNavigatePart }) {
  const [passport, setPassport] = useState(null);
  const [payment, setPayment] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [settlementCount, setSettlementCount] = useState(0);
  const [auditEvents, setAuditEvents] = useState([]);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [toast, setToast] = useState(null);

  const [seeding, setSeeding] = useState(false);
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const data = await p3Api.fetchAllPassports();
      const latest = data.passports?.[data.passports.length - 1];
      if (latest) {
        setPassport(latest.passport);
        setPayment(latest.payment);
        setMerchant(latest.merchant);

        const audit = await p3Api.fetchAuditLog(latest.passport.passport_id);
        setAuditEvents(audit.events || []);

        if (latest.payment?.payment_reference) {
          const settlementsData = await p3Api.fetchSettlements();
          setSettlementCount(settlementsData.settlement_count);
          const key = `${latest.passport.passport_id}::${latest.payment.payment_reference}`;
          const found = settlementsData.settlements?.find(s => s.idempotency_key === key);
          setSettlement(found || null);
        } else {
          const settlementsData = await p3Api.fetchSettlements();
          setSettlementCount(settlementsData.settlement_count);
          setSettlement(null);
        }
      } else {
        setPassport(null);
        setPayment(null);
        setMerchant(null);
        setAuditEvents([]);
        setSettlement(null);
        setSettlementCount(0);
      }
    } catch (err) {
      console.error('Part 3 refresh error:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const unsubscribe = trustbridgeEngine.subscribe(() => {
      refreshAll();
    });
    return () => unsubscribe();
  }, [refreshAll]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await p3Api.seedDemo('Arjun', 'Riya', 250, 'INR', 'tea');
      await refreshAll();
      showToast('✓ Demo Passport Seeded: Ready for Payment & Reconciliation', 'success');
    } catch (err) {
      showToast(`Seed failed: ${err.message}`, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    try {
      await p3Api.resetDemo();
      setReconciliationResult(null);
      await refreshAll();
      showToast('Part 3 stores cleared', 'info');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    }
  };

  const handlePayNow = async (passportId) => {
    if (!passportId) return;
    setPayNowLoading(true);
    try {
      const res = await p3Api.initiatePayment(passportId);
      await refreshAll();
      if (res.mismatch_detected) {
        showToast('🔴 Gateway: SUCCESS ₹250 | Merchant: PENDING ₹250 — MISMATCH DETECTED!', 'warning');
      }
    } catch (err) {
      showToast(`Payment failed: ${err.message}`, 'error');
    } finally {
      setPayNowLoading(false);
    }
  };

  const handleReconcile = async (passportId, paymentRef) => {
    if (!passportId || !paymentRef) return;
    setReconcileLoading(true);
    try {
      const result = await p3Api.reconcilePayment(passportId, paymentRef);
      setReconciliationResult(result.reconciliation_result);
      await refreshAll();
      if (result.all_passed) {
        showToast('✓ Reconciliation PASSED — Evidence verified → VERIFIED → SETTLED', 'success');
      } else {
        showToast('✗ Reconciliation failed', 'error');
      }
    } catch (err) {
      showToast(`Reconciliation error: ${err.message}`, 'error');
    } finally {
      setReconcileLoading(false);
    }
  };

  const handleReplayCallback = async (passportId, paymentRef) => {
    if (!passportId || !paymentRef) return;
    setReplayLoading(true);
    try {
      const result = await p3Api.triggerGatewayCallback(passportId, paymentRef);
      await refreshAll();
      const count = result.settlement_count ?? settlementCount;
      showToast(
        `🔁 Replay #${result.callback_count || '?'} received — Settlement Count = ${count} (idempotent ✓)`,
        'idempotent'
      );
    } catch (err) {
      showToast(`Replay error: ${err.message}`, 'error');
    } finally {
      setReplayLoading(false);
    }
  };

  const currentState = passport?.state || null;

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-slate-200">Reconciliation & Settlement Engine</span>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
            {settlementCount} Idempotent Settlements
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{seeding ? 'Seeding...' : 'Seed Demo ₹250'}</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* State Machine Stepper */}
      <div className="w-full">
        <StateMachineStepper currentState={currentState} />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`p-3 rounded-lg text-xs font-semibold shadow-lg transition-all animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-950 border border-emerald-600 text-emerald-200'
          : toast.type === 'warning' ? 'bg-amber-950 border border-amber-600 text-amber-200'
          : toast.type === 'idempotent' ? 'bg-indigo-950 border border-indigo-600 text-indigo-200'
          : 'bg-slate-800 border border-slate-700 text-slate-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Main Grid: Responsive 3 columns on large desktop, wrapping cleanly on mobile/tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Passport Card (lg: col 4) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Transaction Passport
          </div>
          <PassportCard
            passport={passport}
            payment={payment}
            onPayNow={handlePayNow}
            payNowLoading={payNowLoading}
          />
        </div>

        {/* Center: Gateway vs Merchant Panel (lg: col 4) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Gateway vs Merchant System
          </div>
          <GatewayMerchantPanel
            passport={passport}
            payment={payment}
            merchant={merchant}
          />
        </div>

        {/* Right: Reconciliation Panel (lg: col 4) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reconciliation Engine
          </div>
          <ReconciliationPanel
            passport={passport}
            payment={payment}
            settlement={settlement}
            settlementCount={settlementCount}
            reconciliationResult={reconciliationResult}
            onReconcile={handleReconcile}
            onReplayCallback={handleReplayCallback}
            reconcileLoading={reconcileLoading}
            replayLoading={replayLoading}
          />
        </div>

        {/* Full-width bottom: Immutable Audit Log */}
        <div className="lg:col-span-12 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cryptographic Immutable Audit Trail
          </div>
          <div className="h-72">
            <AuditLog events={auditEvents} passportId={passport?.passport_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
