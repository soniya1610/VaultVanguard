import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  CreditCard,
  RefreshCw,
  Scale,
  ShieldCheck,
  UserCheck,
  MessageSquare
} from 'lucide-react';

const getEventIcon = (eventType, state) => {
  if (eventType.includes('NLP') || eventType.includes('CHAT')) {
    return <MessageSquare style={{ width: 16, height: 16, color: '#818cf8' }} />;
  }
  if (eventType.includes('CONFIRMED')) {
    return <UserCheck style={{ width: 16, height: 16, color: '#34d399' }} />;
  }
  if (eventType.includes('PASSPORT_MINTED')) {
    return <ShieldCheck style={{ width: 16, height: 16, color: '#a78bfa' }} />;
  }
  if (eventType.includes('PAYMENT_INITIATED')) {
    return <CreditCard style={{ width: 16, height: 16, color: '#60a5fa' }} />;
  }
  if (eventType.includes('MISMATCH')) {
    return <AlertTriangle style={{ width: 16, height: 16, color: '#fb923c' }} />;
  }
  if (eventType.includes('RECONCIL')) {
    return <RefreshCw style={{ width: 16, height: 16, color: '#facc15' }} />;
  }
  if (eventType.includes('SETTLED') || eventType.includes('VERIFIED')) {
    return <CheckCircle style={{ width: 16, height: 16, color: '#10b981' }} />;
  }
  if (eventType.includes('DISPUTE')) {
    return <Scale style={{ width: 16, height: 16, color: '#f43f5e' }} />;
  }
  return <FileCheck style={{ width: 16, height: 16, color: '#94a3b8' }} />;
};

export default function PassportTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        No timeline events recorded yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '28px' }}>
      {/* Vertical line connecting events */}
      <div
        style={{
          position: 'absolute',
          left: '11px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          background: 'linear-gradient(to bottom, #6366f1, #10b981)',
          opacity: 0.4,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {timeline.map((event, idx) => (
          <div key={event.event_id || idx} style={{ position: 'relative' }}>
            {/* Event Dot */}
            <div
              style={{
                position: 'absolute',
                left: '-28px',
                top: '2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#0f172a',
                border: '2px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              {getEventIcon(event.event_type, event.state)}
            </div>

            {/* Event Card */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.45)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                    {event.title}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      fontWeight: 700,
                    }}
                  >
                    {event.state}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock style={{ width: 11, height: 11 }} />
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                {event.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                <span>Actor: <strong style={{ color: '#94a3b8' }}>{event.actor}</strong></span>
                {event.evidence_ref && (
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                    ref: {event.evidence_ref.slice(0, 16)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
