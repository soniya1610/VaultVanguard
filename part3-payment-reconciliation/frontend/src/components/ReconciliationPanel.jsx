import React from 'react';
import { CheckCircle2, XCircle, RefreshCw, Shield, Repeat, Hash, Clock } from 'lucide-react';

const CHECK_ICONS = {
  '1. Payer Match':         '👤',
  '2. Receiver Match':      '👤',
  '3. Amount Match':        '💰',
  '4. Passport ID Match':   '🛂',
  '5. Payment Ref Match':   '🔗',
  '6. Gateway Status':      '✅',
};

export default function ReconciliationPanel({
  passport,
  payment,
  settlement,
  settlementCount,
  reconciliationResult,
  onReconcile,
  onReplayCallback,
  reconcileLoading,
  replayLoading,
}) {
  const isMismatch = passport?.state === 'MISMATCH_DETECTED' || passport?.state === 'RECONCILIATION_REQUIRED';
  const isSettled = passport?.state === 'SETTLED';
  const isReconciling = passport?.state === 'RECONCILING';
  const canReconcile = isMismatch && !reconcileLoading;
  const canReplay = payment?.payment_reference && !replayLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Settlement Count Badge — idempotency proof ── */}
      <div
        style={{
          background: 'rgba(15,23,42,0.85)',
          border: `1px solid ${settlementCount === 1 ? 'rgba(16,185,129,0.5)' : settlementCount > 1 ? 'rgba(239,68,68,0.5)' : 'rgba(51,65,85,0.5)'}`,
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hash style={{ width: 16, height: 16, color: settlementCount === 1 ? '#10b981' : '#64748b' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>Settlement Count</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: settlementCount === 1 ? '#34d399' : settlementCount > 1 ? '#ef4444' : '#475569',
              lineHeight: 1,
            }}
          >
            {settlementCount}
          </span>
          {settlementCount === 1 && (
            <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
              Exactly Once ✓
            </span>
          )}
        </div>
      </div>

      {/* ── Reconcile Button ── */}
      <button
        onClick={() => onReconcile(passport?.passport_id, payment?.payment_reference)}
        disabled={!canReconcile || isSettled}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: '12px',
          background: isSettled
            ? 'rgba(16,185,129,0.15)'
            : canReconcile
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'rgba(30,41,59,0.6)',
          color: isSettled ? '#6ee7b7' : canReconcile ? 'white' : '#475569',
          fontWeight: 700,
          fontSize: '13px',
          border: isSettled
            ? '1px solid rgba(16,185,129,0.4)'
            : canReconcile
            ? 'none'
            : '1px solid rgba(51,65,85,0.5)',
          cursor: canReconcile && !isSettled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          boxShadow: canReconcile && !isSettled ? '0 4px 16px rgba(245,158,11,0.35)' : 'none',
        }}
      >
        {reconcileLoading || isReconciling ? (
          <>
            <RefreshCw style={{ width: 16, height: 16 }} className="animate-spin-slow" />
            Running 6-Point Verification...
          </>
        ) : isSettled ? (
          <>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Already Settled — Reconciliation Complete
          </>
        ) : isMismatch ? (
          <>
            <Shield style={{ width: 16, height: 16 }} />
            Run Reconciliation Engine
          </>
        ) : (
          <>
            <Shield style={{ width: 16, height: 16 }} />
            {passport ? 'Waiting for mismatch...' : 'No passport loaded'}
          </>
        )}
      </button>

      {/* ── Replay Gateway Callback — idempotency test ── */}
      <button
        onClick={() => onReplayCallback(passport?.passport_id, payment?.payment_reference)}
        disabled={!canReplay}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '12px',
          background: canReplay ? 'rgba(99,102,241,0.12)' : 'rgba(30,41,59,0.4)',
          color: canReplay ? '#a5b4fc' : '#374151',
          fontWeight: 600,
          fontSize: '12px',
          border: canReplay ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(51,65,85,0.4)',
          cursor: canReplay ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          transition: 'all 0.2s ease',
        }}
      >
        {replayLoading ? (
          <>
            <RefreshCw style={{ width: 14, height: 14 }} className="animate-spin-slow" />
            Replaying...
          </>
        ) : (
          <>
            <Repeat style={{ width: 14, height: 14 }} />
            Replay Gateway Callback (Idempotency Test)
          </>
        )}
      </button>

      {/* ── 6-Point Check Results ── */}
      {reconciliationResult && (
        <div
          className="animate-slide-in"
          style={{
            background: 'rgba(15,23,42,0.85)',
            border: `1px solid ${reconciliationResult.all_passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(51,65,85,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: reconciliationResult.all_passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: reconciliationResult.all_passed ? '#6ee7b7' : '#fca5a5' }}>
              6-Point Evidence Verification
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: reconciliationResult.all_passed ? '#34d399' : '#f87171' }}>
              {reconciliationResult.checks.filter(c => c.passed).length}/6 ✓
            </span>
          </div>

          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reconciliationResult.checks.map((check, idx) => (
              <div
                key={idx}
                className="animate-slide-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '7px 10px',
                  background: check.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  borderRadius: '8px',
                  border: `1px solid ${check.passed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  animationDelay: `${idx * 80}ms`,
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '1px' }}>
                  {check.passed
                    ? <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} className="animate-check" />
                    : <XCircle style={{ width: 14, height: 14, color: '#ef4444' }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: check.passed ? '#6ee7b7' : '#fca5a5' }}>
                    {CHECK_ICONS[check.check_name] || '•'} {check.check_name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span><span style={{ color: '#475569' }}>Expected: </span><span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{String(check.expected)}</span></span>
                    <span><span style={{ color: '#475569' }}>Actual: </span><span style={{ fontFamily: 'monospace', color: check.passed ? '#6ee7b7' : '#fca5a5' }}>{String(check.actual)}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(51,65,85,0.4)',
              background: reconciliationResult.all_passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              fontSize: '11px',
              color: reconciliationResult.all_passed ? '#34d399' : '#f87171',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {reconciliationResult.all_passed
              ? '✓ All evidence verified — Settlement created (idempotent)'
              : '✗ Reconciliation failed — contradictions not resolved'}
          </div>
        </div>
      )}

      {/* ── Settlement Details ── */}
      {settlement && (
        <div
          className="animate-slide-in"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: '14px',
            padding: '14px 16px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock style={{ width: 12, height: 12 }} />
            Settlement Record
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              ['Settlement ID', settlement.settlement_id, 'monospace', '#34d399'],
              ['Idempotency Key', settlement.idempotency_key, 'monospace', '#60a5fa'],
              ['Amount', `${settlement.currency === 'INR' ? '₹' : settlement.currency}${settlement.amount}`, undefined, '#fbbf24'],
              ['Payer', settlement.payer, undefined, '#c7d2fe'],
              ['Receiver', settlement.receiver, undefined, '#a7f3d0'],
              ['Settled At', new Date(settlement.settled_at).toLocaleTimeString(), undefined, '#94a3b8'],
            ].map(([label, value, family, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{label}</span>
                <span style={{ fontFamily: family, fontSize: '10px', color, fontWeight: 600, maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replay result notice */}
      {payment?.gateway_callback_count > 1 && (
        <div
          className="animate-slide-in"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '10px',
            padding: '10px 14px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#a5b4fc', marginBottom: '3px' }}>
            🔁 Idempotency Proven
          </div>
          <div style={{ fontSize: '10px', color: '#818cf8' }}>
            Gateway callback received <strong>{payment.gateway_callback_count}×</strong> — Settlement Count remains <strong>= {settlementCount}</strong>.
            Duplicate callbacks are rejected without creating new records.
          </div>
        </div>
      )}
    </div>
  );
}
