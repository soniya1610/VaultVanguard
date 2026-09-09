import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, Wifi, Building2 } from 'lucide-react';

export default function GatewayMerchantPanel({ passport, payment, merchant }) {
  if (!passport || !payment) {
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
          minHeight: '260px',
        }}
      >
        <Wifi style={{ width: 36, height: 36, color: '#1e293b' }} />
        <p style={{ fontSize: '13px' }}>Awaiting payment initiation</p>
        <p style={{ fontSize: '11px', color: '#334155' }}>Click "Pay Now" to trigger the gateway</p>
      </div>
    );
  }

  const gatewayResponse = payment.gateway_response;
  const hasGatewayResponse = !!gatewayResponse;
  const gatewaySuccess = hasGatewayResponse && gatewayResponse.status === 'SUCCESS';
  const merchantPending = merchant?.status === 'PENDING';
  const merchantSettled = merchant?.status === 'SETTLED';
  const hasMismatch = gatewaySuccess && merchantPending;

  const currency = passport.currency === 'INR' ? '₹' : passport.currency;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Mismatch Alert Banner */}
      {hasMismatch && (
        <div
          className="animate-mismatch animate-slide-in"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
              MISMATCH DETECTED — Reconciliation Required
            </div>
            <div style={{ fontSize: '10px', color: '#fca5a5', marginTop: '2px' }}>
              Gateway confirms payment but merchant system hasn't updated
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side: Gateway vs Merchant */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

        {/* ── Gateway Status ── */}
        <div
          style={{
            background: gatewaySuccess
              ? 'rgba(16,185,129,0.1)'
              : hasGatewayResponse
              ? 'rgba(239,68,68,0.1)'
              : 'rgba(15,23,42,0.7)',
            border: `1px solid ${gatewaySuccess ? 'rgba(16,185,129,0.45)' : hasGatewayResponse ? 'rgba(239,68,68,0.4)' : 'rgba(51,65,85,0.5)'}`,
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Wifi style={{ width: 14, height: 14, color: gatewaySuccess ? '#10b981' : '#64748b' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: gatewaySuccess ? '#6ee7b7' : '#64748b' }}>
              UPI Gateway
            </span>
          </div>

          {!hasGatewayResponse ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '8px 0' }}>
              Awaiting...
            </div>
          ) : (
            <>
              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                {gatewaySuccess
                  ? <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} />
                  : <XCircle style={{ width: 20, height: 20, color: '#ef4444' }} />
                }
                <span style={{ fontSize: '18px', fontWeight: 800, color: gatewaySuccess ? '#34d399' : '#f87171' }}>
                  {gatewayResponse.status}
                </span>
              </div>

              {/* Amount */}
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {currency}{gatewayResponse.amount}
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '9px', color: '#64748b' }}>
                  <span style={{ color: '#475569' }}>Ref: </span>
                  <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{gatewayResponse.paymentReference}</span>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>
                  <span style={{ color: '#475569' }}>GW Txn: </span>
                  <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{gatewayResponse.gatewayTransactionId}</span>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b' }}>
                  <span style={{ color: '#475569' }}>Payer: </span>
                  <span style={{ color: '#c7d2fe' }}>{gatewayResponse.payer}</span>
                  <span style={{ color: '#475569' }}> → </span>
                  <span style={{ color: '#a7f3d0' }}>{gatewayResponse.receiver}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Merchant Status ── */}
        <div
          style={{
            background: merchantSettled
              ? 'rgba(16,185,129,0.1)'
              : merchantPending && hasGatewayResponse
              ? 'rgba(234,179,8,0.1)'
              : 'rgba(15,23,42,0.7)',
            border: `1px solid ${
              merchantSettled
                ? 'rgba(16,185,129,0.45)'
                : merchantPending && hasGatewayResponse
                ? 'rgba(234,179,8,0.45)'
                : 'rgba(51,65,85,0.5)'
            }`,
            borderRadius: '14px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Building2 style={{ width: 14, height: 14, color: merchantSettled ? '#10b981' : merchantPending ? '#eab308' : '#64748b' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: merchantSettled ? '#6ee7b7' : merchantPending ? '#fde047' : '#64748b' }}>
              Merchant Ledger
            </span>
          </div>

          {!merchant ? (
            <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', padding: '8px 0' }}>
              No record
            </div>
          ) : (
            <>
              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                {merchantSettled
                  ? <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} />
                  : merchantPending
                  ? <AlertTriangle style={{ width: 20, height: 20, color: '#eab308', animation: hasGatewayResponse ? 'pulse-subtle 1.5s ease-in-out infinite' : 'none' }} />
                  : <XCircle style={{ width: 20, height: 20, color: '#ef4444' }} />
                }
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: merchantSettled ? '#34d399' : merchantPending ? '#fde047' : '#f87171',
                  }}
                >
                  {merchant.status}
                </span>
              </div>

              {/* Amount */}
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: merchantSettled ? '#fbbf24' : merchantPending && hasGatewayResponse ? '#ef4444' : '#fbbf24',
                  letterSpacing: '-0.02em',
                  marginBottom: '6px',
                }}
              >
                {currency}{merchant.amount}
              </div>

              {/* Reason */}
              <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.4 }}>
                {merchant.last_update_reason}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contradiction evidence card — only when mismatch, preserved forever */}
      {hasMismatch && (
        <div
          className="animate-slide-in"
          style={{
            background: 'rgba(30,15,15,0.6)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            ⚠ Contradictory Evidence (Preserved — not overwritten)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '8px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: '10px', color: '#6ee7b7', fontWeight: 600 }}>Gateway</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>SUCCESS {currency}{gatewayResponse?.amount}</div>
            </div>
            <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: 700 }}>≠</div>
            <div style={{ textAlign: 'center', padding: '8px 12px', background: 'rgba(234,179,8,0.1)', borderRadius: '8px', border: '1px solid rgba(234,179,8,0.3)' }}>
              <div style={{ fontSize: '10px', color: '#fde047', fontWeight: 600 }}>Merchant</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>PENDING {currency}{merchant?.amount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Settled summary */}
      {merchantSettled && (
        <div
          className="animate-slide-in"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <TrendingUp style={{ width: 18, height: 18, color: '#10b981' }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>Merchant Ledger Updated</div>
            <div style={{ fontSize: '10px', color: '#6ee7b7', marginTop: '2px' }}>
              Reconciliation confirmed — PENDING → SETTLED
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
