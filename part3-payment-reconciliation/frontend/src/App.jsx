import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Play, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import PassportCard from './components/PassportCard.jsx';
import GatewayMerchantPanel from './components/GatewayMerchantPanel.jsx';
import ReconciliationPanel from './components/ReconciliationPanel.jsx';
import AuditLog from './components/AuditLog.jsx';
import StateMachineStepper from './components/StateMachineStepper.jsx';
import {
  fetchHealth,
  fetchAllPassports,
  fetchAuditLog,
  fetchSettlements,
  seedDemo,
  resetDemo,
  initiatePayment,
  triggerGatewayCallback,
  reconcilePayment,
} from './api.js';

export default function App() {
  // ── State ─────────────────────────────────────────────────────────────
  const [passport, setPassport] = useState(null);
  const [payment, setPayment] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [settlementCount, setSettlementCount] = useState(0);
  const [auditEvents, setAuditEvents] = useState([]);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [toast, setToast] = useState(null);

  // Loading states
  const [seeding, setSeeding] = useState(false);
  const [payNowLoading, setPayNowLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);

  // ── Toast utility ────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Data refresh ─────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    try {
      // Health check
      const health = await fetchHealth().catch(() => null);
      setBackendOnline(!!health);

      // Passports
      const data = await fetchAllPassports();
      const latest = data.passports?.[data.passports.length - 1];
      if (latest) {
        setPassport(latest.passport);
        setPayment(latest.payment);
        setMerchant(latest.merchant);

        // Audit log
        const audit = await fetchAuditLog(latest.passport.passport_id);
        setAuditEvents(audit.events || []);

        // Settlement
        if (latest.payment?.payment_reference) {
          const settlementsData = await fetchSettlements();
          setSettlementCount(settlementsData.settlement_count);
          const key = `${latest.passport.passport_id}::${latest.payment.payment_reference}`;
          const found = settlementsData.settlements?.find(s => s.idempotency_key === key);
          setSettlement(found || null);
        } else {
          const settlementsData = await fetchSettlements();
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
      console.error('Refresh error:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 2500);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // ── Demo seed ─────────────────────────────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemo();
      await refreshAll();
      setReconciliationResult(null);
      showToast('✓ Demo passport seeded — CONFIRMED ₹250 ready for Pay Now', 'success');
    } catch (err) {
      showToast(`Seed failed: ${err.message}`, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo();
      setPassport(null);
      setPayment(null);
      setMerchant(null);
      setSettlement(null);
      setSettlementCount(0);
      setAuditEvents([]);
      setReconciliationResult(null);
      showToast('Store reset — all data cleared', 'info');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    }
  };

  // ── Pay Now ───────────────────────────────────────────────────────────
  const handlePayNow = async (passportId) => {
    setPayNowLoading(true);
    try {
      // Step 1: Initiate payment
      const initResult = await initiatePayment(passportId);
      await refreshAll();
      showToast(`⚡ Payment initiated — ${initResult.payment_reference}`, 'info');

      // Step 2: Auto-trigger gateway callback (simulates UPI response arriving)
      await new Promise(r => setTimeout(r, 900));
      const payRef = initResult.payment_reference || initResult.payment?.payment_reference;
      if (payRef) {
        await triggerGatewayCallback(passportId, payRef);
        await refreshAll();
        showToast('🔴 Gateway: SUCCESS ₹250 | Merchant: PENDING ₹250 — MISMATCH DETECTED!', 'warning');
      }
    } catch (err) {
      showToast(`Payment failed: ${err.message}`, 'error');
    } finally {
      setPayNowLoading(false);
    }
  };

  // ── Reconcile ─────────────────────────────────────────────────────────
  const handleReconcile = async (passportId, paymentRef) => {
    if (!passportId || !paymentRef) return;
    setReconcileLoading(true);
    try {
      const result = await reconcilePayment(passportId, paymentRef);
      setReconciliationResult(result.reconciliation_result);
      await refreshAll();
      if (result.all_passed) {
        showToast('✓ Reconciliation PASSED — Evidence verified → VERIFIED → SETTLED', 'success');
      } else {
        showToast('✗ Reconciliation failed — check results', 'error');
      }
    } catch (err) {
      showToast(`Reconciliation error: ${err.message}`, 'error');
    } finally {
      setReconcileLoading(false);
    }
  };

  // ── Replay gateway callback (idempotency test) ─────────────────────────
  const handleReplayCallback = async (passportId, paymentRef) => {
    if (!passportId || !paymentRef) return;
    setReplayLoading(true);
    try {
      const result = await triggerGatewayCallback(passportId, paymentRef);
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

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header
        style={{
          background: 'rgba(15,23,42,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(51,65,85,0.6)',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>TrustBridge</h1>
              <span style={{ fontSize: '10px', background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.4)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                Part 3: Payment & Reconciliation
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#475569' }}>Mock UPI Gateway · Reconciliation Engine · Idempotent Settlement</p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Backend status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: backendOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${backendOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: backendOnline ? '#10b981' : '#ef4444', animation: 'pulse-subtle 2s infinite' }} />
            <span style={{ fontSize: '10px', color: backendOnline ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {backendOnline === null ? 'Checking...' : backendOnline ? 'API :8001' : 'Offline'}
            </span>
          </div>

          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{
              padding: '6px 14px',
              background: seeding ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.2)',
              color: '#34d399',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: seeding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <Play style={{ width: 12, height: 12, fill: 'currentColor' }} />
            {seeding ? 'Seeding...' : 'Seed Demo ₹250'}
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '6px 10px',
              background: 'rgba(51,65,85,0.4)',
              color: '#64748b',
              border: '1px solid rgba(51,65,85,0.6)',
              borderRadius: '8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw style={{ width: 12, height: 12 }} />
            Reset
          </button>
        </div>
      </header>

      {/* ── State Machine Stepper ── */}
      <div style={{ padding: '12px 24px 0' }}>
        <StateMachineStepper currentState={currentState} />
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="animate-slide-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            padding: '12px 18px',
            borderRadius: '12px',
            maxWidth: '400px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            background: toast.type === 'success'
              ? 'rgba(16,185,129,0.2)'
              : toast.type === 'error'
              ? 'rgba(239,68,68,0.2)'
              : toast.type === 'warning'
              ? 'rgba(234,179,8,0.2)'
              : toast.type === 'idempotent'
              ? 'rgba(99,102,241,0.2)'
              : 'rgba(51,65,85,0.7)',
            border: `1px solid ${
              toast.type === 'success' ? 'rgba(16,185,129,0.5)'
              : toast.type === 'error' ? 'rgba(239,68,68,0.5)'
              : toast.type === 'warning' ? 'rgba(234,179,8,0.5)'
              : toast.type === 'idempotent' ? 'rgba(99,102,241,0.5)'
              : 'rgba(51,65,85,0.7)'
            }`,
            color: toast.type === 'success' ? '#34d399'
              : toast.type === 'error' ? '#fca5a5'
              : toast.type === 'warning' ? '#fde047'
              : toast.type === 'idempotent' ? '#a5b4fc'
              : '#cbd5e1',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.type === 'error' && <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {toast.type === 'idempotent' && <Zap style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {toast.message}
        </div>
      )}

      {/* ── Main Grid ── */}
      <main style={{ flex: 1, padding: '16px 24px 24px', display: 'grid', gridTemplateColumns: '320px 1fr 300px', gridTemplateRows: 'auto 1fr', gap: '14px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Left: Passport Card */}
        <div style={{ gridRow: '1 / span 2' }}>
          <div style={{ position: 'sticky', top: '76px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>
              Transaction Passport
            </div>
            <PassportCard
              passport={passport}
              payment={payment}
              onPayNow={handlePayNow}
              payNowLoading={payNowLoading}
            />
          </div>
        </div>

        {/* Center: Gateway vs Merchant */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '10px' }}>
            Gateway vs Merchant System
          </div>
          <GatewayMerchantPanel
            passport={passport}
            payment={payment}
            merchant={merchant}
          />
        </div>

        {/* Right: Reconciliation Panel */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '10px' }}>
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

        {/* Center + Right bottom: Audit Log */}
        <div style={{ gridColumn: '2 / 4', minHeight: '300px', maxHeight: '380px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '10px' }}>
            Immutable Audit Trail
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <AuditLog events={auditEvents} passportId={passport?.passport_id} />
          </div>
        </div>
      </main>
    </div>
  );
}
