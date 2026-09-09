import React from 'react';
import { Activity, Clock, ShieldCheck, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

const EVENT_CONFIG = {
  PASSPORT_IMPORTED:           { color: '#6366f1', icon: ShieldCheck,   label: 'Passport Imported' },
  PAYMENT_INITIATED:           { color: '#3b82f6', icon: Zap,           label: 'Payment Initiated' },
  GATEWAY_REQUEST_SENT:        { color: '#8b5cf6', icon: Activity,      label: 'Gateway Request Sent' },
  GATEWAY_SUCCESS:             { color: '#10b981', icon: CheckCircle2,  label: 'Gateway Success' },
  MERCHANT_CHECKED:            { color: '#f59e0b', icon: Clock,         label: 'Merchant Checked' },
  MISMATCH_DETECTED:           { color: '#ef4444', icon: AlertTriangle, label: 'Mismatch Detected' },
  RECONCILIATION_STARTED:      { color: '#fb923c', icon: Activity,      label: 'Reconciliation Started' },
  RECONCILIATION_CHECK:        { color: '#fb923c', icon: CheckCircle2,  label: 'Reconciliation Check' },
  RECONCILIATION_PASSED:       { color: '#10b981', icon: CheckCircle2,  label: 'Reconciliation Passed' },
  RECONCILIATION_FAILED:       { color: '#ef4444', icon: AlertTriangle, label: 'Reconciliation Failed' },
  PASSPORT_VERIFIED:           { color: '#10b981', icon: ShieldCheck,   label: 'Passport Verified' },
  SETTLEMENT_CREATED:          { color: '#34d399', icon: CheckCircle2,  label: 'Settlement Created' },
  DUPLICATE_SETTLEMENT_REJECTED:{ color: '#6366f1', icon: Zap,         label: 'Duplicate Rejected' },
  GATEWAY_CALLBACK_REPLAY:     { color: '#6366f1', icon: Zap,           label: 'Callback Replay' },
};

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return iso.slice(0, 19); }
}

export default function AuditViewer({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
        <Activity style={{ width: 32, height: 32, marginBottom: '12px', opacity: 0.4 }} />
        <div style={{ fontSize: '13px', fontWeight: 600 }}>No audit events yet</div>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>System-wide audit trail will appear here as transactions are processed</div>
      </div>
    );
  }

  const reversed = [...events].reverse();

  return (
    <div
      className="glass-card animate-fade-in"
      style={{ overflow: 'hidden', height: '520px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(51,65,85,0.5)',
        display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
      }}>
        <Activity style={{ width: 13, height: 13, color: '#6366f1' }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
          System Audit Trail
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
          background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)',
        }}>
          {events.length} events
        </span>
      </div>

      {/* Events — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {reversed.map((ev, i) => {
          const cfg = EVENT_CONFIG[ev.event_type] || { color: '#64748b', icon: Activity, label: ev.event_type };
          const Icon = cfg.icon;
          const isLast = i === reversed.length - 1;

          return (
            <div
              key={ev.event_id || i}
              className="animate-fade-in"
              style={{
                display: 'flex',
                gap: '12px',
                padding: '8px 10px',
                borderRadius: '8px',
                transition: 'background 0.15s',
                animationDelay: `${Math.min(i * 30, 300)}ms`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(51,65,85,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Timeline dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '8px',
                  background: `${cfg.color}20`,
                  border: `1px solid ${cfg.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: 12, height: 12, color: cfg.color }} />
                </div>
                {!isLast && (
                  <div style={{ width: 1, flex: 1, minHeight: '8px', background: 'rgba(51,65,85,0.4)', marginTop: '4px' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="font-mono" style={{ fontSize: '9px', color: '#334155' }}>
                    {ev.passport_id}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '4px' }}>
                  {ev.description}
                </div>

                {/* Key data fields */}
                {ev.data && Object.keys(ev.data).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(ev.data)
                      .filter(([k]) => ['amount', 'gateway_status', 'merchant_status', 'payer', 'receiver', 'settlement_count', 'callback_count'].includes(k))
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <span key={k} style={{
                          fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                          background: 'rgba(30,41,59,0.6)', color: '#64748b',
                          border: '1px solid rgba(51,65,85,0.4)',
                        }}>
                          <span style={{ color: '#475569' }}>{k}: </span>
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{String(v)}</span>
                        </span>
                      ))
                    }
                  </div>
                )}

                <div style={{ fontSize: '9px', color: '#334155', marginTop: '4px' }}>
                  {formatTime(ev.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
