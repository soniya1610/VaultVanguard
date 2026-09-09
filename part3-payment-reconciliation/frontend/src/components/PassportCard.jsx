import React from 'react';
import {
  Shield, ShieldCheck, CreditCard, Clock, AlertTriangle,
  CheckCircle2, Zap, Lock, ArrowRight
} from 'lucide-react';

const STATE_META = {
  CONFIRMED: {
    label: 'CONFIRMED',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.4)',
    icon: ShieldCheck,
    description: 'Transaction Passport confirmed — ready for payment',
  },
  PAYMENT_INITIATED: {
    label: 'PAYMENT_INITIATED',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.4)',
    icon: CreditCard,
    description: 'Pay Now clicked — payment record created',
  },
  PAYMENT_PENDING: {
    label: 'PAYMENT_PENDING',
    color: '#fde047',
    bg: 'rgba(234,179,8,0.1)',
    border: 'rgba(234,179,8,0.4)',
    icon: Clock,
    description: 'Waiting for Mock UPI Gateway response...',
  },
  PAYMENT_PROCESSED: {
    label: 'PAYMENT_PROCESSED',
    color: '#c084fc',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.4)',
    icon: Zap,
    description: 'Gateway returned a response',
  },
  MISMATCH_DETECTED: {
    label: 'MISMATCH_DETECTED',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.5)',
    icon: AlertTriangle,
    description: 'Gateway SUCCESS ≠ Merchant PENDING — contradiction detected!',
  },
  RECONCILIATION_REQUIRED: {
    label: 'RECONCILIATION_REQUIRED',
    color: '#f87171',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.5)',
    icon: AlertTriangle,
    description: 'Reconciliation engine required to resolve mismatch',
  },
  RECONCILING: {
    label: 'RECONCILING',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.4)',
    icon: Clock,
    description: '6-point evidence verification in progress...',
  },
  VERIFIED: {
    label: 'VERIFIED',
    color: '#6ee7b7',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.4)',
    icon: CheckCircle2,
    description: 'All 6 reconciliation checks passed ✓',
  },
  SETTLED: {
    label: 'SETTLED',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.18)',
    border: 'rgba(16,185,129,0.6)',
    icon: Lock,
    description: 'Idempotent settlement complete — exactly one settlement record',
  },
};

export default function PassportCard({ passport, payment, onPayNow, payNowLoading }) {
  if (!passport) {
    return (
      <div
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(51,65,85,0.5)',
          borderRadius: '16px',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#475569',
          textAlign: 'center',
          minHeight: '280px',
        }}
      >
        <Shield style={{ width: 40, height: 40, color: '#1e293b' }} />
        <p style={{ fontSize: '13px' }}>No CONFIRMED passport loaded</p>
        <p style={{ fontSize: '11px', color: '#334155' }}>Use "Seed Demo" to create a ₹250 passport</p>
      </div>
    );
  }

  const meta = STATE_META[passport.state] || STATE_META['CONFIRMED'];
  const Icon = meta.icon;
  const isConfirmed = passport.state === 'CONFIRMED';
  const isSettled = passport.state === 'SETTLED';
  const isMismatch = passport.state === 'MISMATCH_DETECTED' || passport.state === 'RECONCILIATION_REQUIRED';

  const currency = passport.currency === 'INR' ? '₹' : passport.currency;

  return (
    <div
      className="animate-slide-in"
      style={{
        background: 'rgba(15,23,42,0.85)',
        border: `1px solid ${meta.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isSettled
          ? '0 0 32px rgba(16,185,129,0.15)'
          : isMismatch
          ? '0 0 24px rgba(239,68,68,0.12)'
          : 'none',
        animation: isSettled ? 'settled-glow 2s ease-in-out infinite' : isMismatch ? 'mismatch-flash 1.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Header stripe */}
      <div style={{ background: meta.bg, padding: '14px 20px', borderBottom: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon style={{ width: 18, height: 18, color: meta.color }} />
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: meta.color }}>
            Transaction Passport
          </span>
        </div>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: meta.color,
            background: 'rgba(0,0,0,0.3)',
            padding: '3px 10px',
            borderRadius: '6px',
            border: `1px solid ${meta.border}`,
          }}
        >
          {meta.label}
        </span>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Passport ID */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Passport ID
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: meta.color, letterSpacing: '0.04em' }}>
            {passport.passport_id}
          </div>
        </div>

        {/* Amount — prominent */}
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid rgba(51,65,85,0.4)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Transaction Amount
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {currency}{passport.amount}
          </div>
          {passport.purpose && passport.purpose !== 'Unspecified' && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textTransform: 'capitalize' }}>
              for {passport.purpose}
            </div>
          )}
        </div>

        {/* Payer → Receiver */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div style={{ fontSize: '9px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payer</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#c7d2fe', marginTop: '2px' }}>{passport.payer}</div>
          </div>
          <ArrowRight style={{ width: 16, height: 16, color: '#475569', flexShrink: 0 }} />
          <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', borderRadius: '10px', padding: '10px 14px', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ fontSize: '9px', color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receiver</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#a7f3d0', marginTop: '2px' }}>{passport.receiver}</div>
          </div>
        </div>

        {/* State description */}
        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
          {meta.description}
        </div>

        {/* Payment reference (if exists) */}
        {payment?.payment_reference && (
          <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px 12px', border: '1px solid rgba(51,65,85,0.4)' }}>
            <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment Reference</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', fontWeight: 600, marginTop: '2px' }}>{payment.payment_reference}</div>
          </div>
        )}

        {/* Settlement ID (if settled) */}
        {passport.settlement_id && (
          <div style={{ marginBottom: '14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '8px 12px', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ fontSize: '9px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Settlement ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>{passport.settlement_id}</div>
          </div>
        )}

        {/* Pay Now button — only when CONFIRMED */}
        {isConfirmed && (
          <button
            onClick={() => onPayNow(passport.passport_id)}
            disabled={payNowLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: payNowLoading
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: payNowLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: payNowLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              transform: payNowLoading ? 'none' : undefined,
            }}
            onMouseEnter={e => { if (!payNowLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            {payNowLoading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin-slow" />
                Initiating Payment...
              </>
            ) : (
              <>
                <CreditCard style={{ width: 18, height: 18 }} />
                Pay Now — {currency}{passport.amount} via UPI
              </>
            )}
          </button>
        )}

        {/* Settled badge */}
        {isSettled && (
          <div
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.5)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Lock style={{ width: 16, height: 16 }} />
            SETTLED — Exactly-Once Settlement Complete ✓
          </div>
        )}
      </div>
    </div>
  );
}
