import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Zap,
  RotateCcw,
  ExternalLink,
  Layers,
  ArrowRight,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import PassportTimeline from './components/PassportTimeline.jsx';
import CryptographicAudit from './components/CryptographicAudit.jsx';
import UPILauncher from './components/UPILauncher.jsx';
import {
  fetchHealth,
  fetchPassports,
  fetchPassport,
  seedDemo,
  resetDemo,
} from './api.js';

export default function App() {
  const [passports, setPassports] = useState([]);
  const [selectedPassportId, setSelectedPassportId] = useState(null);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const health = await fetchHealth().catch(() => null);
      setBackendOnline(!!health);

      const res = await fetchPassports().catch(() => ({ passports: [] }));
      const list = res.passports || [];
      setPassports(list);

      if (list.length > 0) {
        const currentId = selectedPassportId || list[list.length - 1].passport_id;
        setSelectedPassportId(currentId);
        const detail = await fetchPassport(currentId).catch(() => null);
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
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSelectPassport = async (pid) => {
    setSelectedPassportId(pid);
    try {
      const detail = await fetchPassport(pid);
      setSelectedPassport(detail.passport);
    } catch (err) {
      showToast(`Failed to load passport ${pid}`, 'error');
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedDemo();
      setSelectedPassportId(res.passport_id);
      await loadData();
      showToast(`✓ Seeded Passport ${res.passport_id}`, 'success');
    } catch (err) {
      showToast(`Seed failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo();
      setSelectedPassportId(null);
      setSelectedPassport(null);
      await loadData();
      showToast('Part 2 store reset', 'info');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Monorepo Ecosystem Quick Nav ── */}
      <div
        style={{
          background: '#090d16',
          borderBottom: '1px solid #1f2937',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>TrustBridge Monorepo:</span>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px' }}
          >
            Part 1: Chat & Consent (:5173) ↗
          </a>
          <span
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#818cf8',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              border: '1px solid rgba(99, 102, 241, 0.4)',
            }}
          >
            Part 2: Passport & State (:5175) [Active]
          </span>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px' }}
          >
            Part 3: Payment & Reconcile (:5174) ↗
          </a>
          <a
            href="http://localhost:5176"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px' }}
          >
            Part 4: Merchant & Dispute (:5176) ↗
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#ef4444',
            }}
          />
          <span style={{ color: backendOnline ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {backendOnline ? 'Backend Online (:8002)' : 'Backend Offline'}
          </span>
        </div>
      </div>

      {/* ── Main App Header ── */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
          padding: '0 24px',
          height: '62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                TrustBridge
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                Part 2: Transaction Passport & State Machine
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#64748b' }}>
              Central Source of Truth · Immutable Cryptographic Ledger · UPI Orchestration
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSeed}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap style={{ width: 13, height: 13 }} />
            Seed Demo Passport
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              background: 'rgba(51, 65, 85, 0.4)',
              color: '#94a3b8',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <RotateCcw style={{ width: 12, height: 12 }} />
            Reset
          </button>
        </div>
      </header>

      {/* ── Toast notification ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            right: '24px',
            zIndex: 999,
            padding: '10px 16px',
            borderRadius: '8px',
            background: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e293b',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Main Workspace ── */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        
        {/* Passports Selector Bar */}
        {passports.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Active Passports:</span>
            {passports.map((p) => {
              const active = p.passport_id === selectedPassportId;
              return (
                <button
                  key={p.passport_id}
                  onClick={() => handleSelectPassport(p.passport_id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    background: active ? '#4f46e5' : '#1e293b',
                    color: active ? 'white' : '#94a3b8',
                    border: `1px solid ${active ? '#6366f1' : '#334155'}`,
                    cursor: 'pointer',
                  }}
                >
                  {p.passport_id} ({p.state})
                </button>
              );
            })}
          </div>
        )}

        {selectedPassport ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Left Column: Passport Identity Card & UPI & Crypto Proof */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Primary Identity Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#818cf8', fontWeight: 800 }}>
                      Official Transaction Passport
                    </span>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                      {selectedPassport.passport_id}
                    </h2>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>
                      Minted: {new Date(selectedPassport.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: selectedPassport.state === 'SETTLED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        color: selectedPassport.state === 'SETTLED' ? '#34d399' : '#818cf8',
                        border: `1px solid ${selectedPassport.state === 'SETTLED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                      }}
                    >
                      {selectedPassport.state}
                    </span>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#facc15', marginTop: '6px' }}>
                      ₹{selectedPassport.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Participants & Purpose Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: '#090d16', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Payer (Borrower)</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>{selectedPassport.payer}</p>
                    <span style={{ fontSize: '10px', color: '#10b981' }}>Confirmed ✓</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Receiver (Lender)</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>{selectedPassport.receiver}</p>
                    <span style={{ fontSize: '10px', color: '#10b981' }}>Confirmed ✓</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Purpose</span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', textTransform: 'capitalize' }}>
                      {selectedPassport.purpose}
                    </p>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Chat Agreement</span>
                  </div>
                </div>

                {/* References */}
                <div style={{ marginTop: '14px', display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8' }}>
                  <div>
                    Thread: <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedPassport.conversation_id}</span>
                  </div>
                  {selectedPassport.payment_reference && (
                    <div>
                      Payment Ref: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedPassport.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* UPI Payment Launcher ("Pay Now" Interface) */}
              <UPILauncher
                passport={selectedPassport}
                onPaymentTriggered={() => loadData()}
              />

              {/* Cryptographic SHA-256 Audit Verification */}
              <CryptographicAudit passport={selectedPassport} />

            </div>

            {/* Right Column: Complete Transaction Passport Timeline */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(51, 65, 85, 0.6)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ width: 18, height: 18, color: '#818cf8' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    Transaction Passport Timeline
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedPassport.timeline?.length || 0} auditable milestones
                </span>
              </div>

              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.4' }}>
                Chronological record of the commitment from natural conversation to mutual consent,
                payment gateway reports, mismatch resolution, and final verified settlement.
              </p>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px', paddingRight: '6px' }}>
                <PassportTimeline timeline={selectedPassport.timeline} />
              </div>
            </div>

          </div>
        ) : (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px dashed #334155',
              borderRadius: '12px',
            }}
          >
            <ShieldCheck style={{ width: 44, height: 44, color: '#64748b', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#cbd5e1' }}>
              No Transaction Passports Minted
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '460px', margin: '6px auto 16px' }}>
              Either conduct a conversation between Arjun and Riya in Part 1 to trigger mutual consent,
              or click "Seed Demo Passport" above to load a test record.
            </p>
            <button
              onClick={handleSeed}
              style={{
                padding: '8px 18px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Seed Demo Passport (₹250 Tea)
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
