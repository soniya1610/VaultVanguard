import React, { useRef, useEffect } from 'react';
import { FileText, AlertTriangle, CheckCircle2, Clock, Shield, Zap, Building2, Hash } from 'lucide-react';

const EVENT_META = {
  PASSPORT_IMPORTED:             { color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  icon: Shield,         label: 'Passport Imported' },
  PAYMENT_INITIATED:             { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',   icon: Zap,            label: 'Payment Initiated' },
  GATEWAY_REQUEST_SENT:          { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',  icon: Clock,          label: 'Gateway Request Sent' },
  GATEWAY_SUCCESS:               { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  icon: CheckCircle2,   label: 'Gateway: SUCCESS' },
  MERCHANT_CHECKED:              { color: '#fbbf24', bg: 'rgba(234,179,8,0.12)',   icon: Building2,      label: 'Merchant Checked' },
  MISMATCH_DETECTED:             { color: '#f87171', bg: 'rgba(239,68,68,0.14)',   icon: AlertTriangle,  label: 'MISMATCH DETECTED' },
  RECONCILIATION_STARTED:        { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: Shield,         label: 'Reconciliation Started' },
  RECONCILIATION_CHECK:          { color: '#94a3b8', bg: 'rgba(51,65,85,0.3)',     icon: CheckCircle2,   label: 'Check' },
  RECONCILIATION_PASSED:         { color: '#34d399', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2,   label: 'All Checks Passed ✓' },
  RECONCILIATION_FAILED:         { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  icon: AlertTriangle,  label: 'Checks Failed' },
  PASSPORT_VERIFIED:             { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', icon: Shield,         label: 'Passport Verified' },
  SETTLEMENT_CREATED:            { color: '#34d399', bg: 'rgba(16,185,129,0.18)', icon: Hash,           label: 'Settlement Created' },
  DUPLICATE_SETTLEMENT_REJECTED: { color: '#c084fc', bg: 'rgba(168,85,247,0.12)', icon: AlertTriangle,  label: 'Duplicate Rejected ✓' },
  GATEWAY_CALLBACK_REPLAY:       { color: '#818cf8', bg: 'rgba(99,102,241,0.12)', icon: Zap,            label: 'Gateway Replay #' },
};

function formatTime(isoStr) {
  try {
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch {
    return isoStr;
  }
}

function AuditEventRow({ event, index }) {
  const meta = EVENT_META[event.event_type] || {
    color: '#64748b', bg: 'rgba(51,65,85,0.2)', icon: FileText, label: event.event_type,
  };
  const Icon = meta.icon;
  const isImportant = ['MISMATCH_DETECTED', 'SETTLEMENT_CREATED', 'RECONCILIATION_PASSED', 'DUPLICATE_SETTLEMENT_REJECTED'].includes(event.event_type);

  return (
    <div
      className="animate-slide-in"
      style={{
        display: 'flex',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '8px',
        background: isImportant ? meta.bg : 'transparent',
        border: `1px solid ${isImportant ? meta.color + '30' : 'transparent'}`,
        animationDelay: `${Math.min(index * 30, 300)}ms`,
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: meta.bg, border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
        <Icon style={{ width: 11, height: 11, color: meta.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: meta.color, lineHeight: 1.2 }}>
            {meta.label}{event.event_type === 'GATEWAY_CALLBACK_REPLAY' ? event.data?.callback_count || '' : ''}
          </span>
          <span style={{ fontSize: '9px', color: '#475569', flexShrink: 0, fontFamily: 'monospace' }}>
            {formatTime(event.timestamp)}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
          {event.description}
        </div>

        {/* Key data inline for important events */}
        {event.event_type === 'MISMATCH_DETECTED' && event.data && (
          <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
            <span style={{ fontSize: '9px', background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '1px 6px', borderRadius: '4px' }}>
              GW: {event.data.gateway_status} ₹{event.data.gateway_amount}
            </span>
            <span style={{ fontSize: '9px', background: 'rgba(234,179,8,0.15)', color: '#fde047', padding: '1px 6px', borderRadius: '4px' }}>
              Merchant: {event.data.merchant_status} ₹{event.data.merchant_amount}
            </span>
          </div>
        )}
        {event.event_type === 'SETTLEMENT_CREATED' && event.data && (
          <div style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '9px', color: '#34d399', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
            {event.data.settlement_id} | Count={event.data.total_settlement_count}
          </div>
        )}
        {event.event_type === 'DUPLICATE_SETTLEMENT_REJECTED' && event.data && (
          <div style={{ marginTop: '4px', fontSize: '9px', color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
            Settlement Count still = {event.data.total_settlement_count} (idempotent)
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditLog({ events, passportId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events?.length]);

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(51,65,85,0.5)',
        borderRadius: '14px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(51,65,85,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText style={{ width: 14, height: 14, color: '#64748b' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Audit Trail</span>
          {passportId && (
            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#475569', background: 'rgba(51,65,85,0.4)', padding: '1px 6px', borderRadius: '4px' }}>
              {passportId}
            </span>
          )}
        </div>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.3)' }}>
          {events?.length || 0} events · append-only
        </span>
      </div>

      {/* Events list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {!events || events.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', gap: '8px', color: '#334155' }}>
            <FileText style={{ width: 28, height: 28, color: '#1e293b' }} />
            <span style={{ fontSize: '11px' }}>No events yet</span>
          </div>
        ) : (
          events.map((event, idx) => (
            <AuditEventRow key={event.event_id} event={event} index={idx} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer note */}
      {events && events.length > 0 && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid rgba(51,65,85,0.4)', background: 'rgba(0,0,0,0.15)', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', color: '#374151' }}>
            📝 Immutable — contradictory evidence preserved, never deleted or overwritten
          </span>
        </div>
      )}
    </div>
  );
}
