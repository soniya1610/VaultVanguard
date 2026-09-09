import React from 'react';

const STATE_STEPS = [
  { key: 'CONFIRMED',             label: 'Confirmed',           short: 'CNF' },
  { key: 'PAYMENT_INITIATED',     label: 'Pay Now',             short: 'INI' },
  { key: 'PAYMENT_PENDING',       label: 'Pending',             short: 'PND' },
  { key: 'PAYMENT_PROCESSED',     label: 'Processed',           short: 'PRC' },
  { key: 'MISMATCH_DETECTED',     label: 'Mismatch!',           short: 'MIS' },
  { key: 'RECONCILING',           label: 'Reconciling',         short: 'REC' },
  { key: 'VERIFIED',              label: 'Verified',            short: 'VER' },
  { key: 'SETTLED',               label: 'Settled ✓',           short: 'SET' },
];

const STEP_COLORS = {
  CONFIRMED:           { dot: 'bg-indigo-500',   ring: 'ring-indigo-400',   text: 'text-indigo-300',    line: 'bg-indigo-500/40' },
  PAYMENT_INITIATED:   { dot: 'bg-blue-500',      ring: 'ring-blue-400',     text: 'text-blue-300',      line: 'bg-blue-500/40' },
  PAYMENT_PENDING:     { dot: 'bg-yellow-500',    ring: 'ring-yellow-400',   text: 'text-yellow-300',    line: 'bg-yellow-500/40' },
  PAYMENT_PROCESSED:   { dot: 'bg-purple-500',    ring: 'ring-purple-400',   text: 'text-purple-300',    line: 'bg-purple-500/40' },
  MISMATCH_DETECTED:   { dot: 'bg-red-500',       ring: 'ring-red-400',      text: 'text-red-300',       line: 'bg-red-500/40' },
  RECONCILING:         { dot: 'bg-orange-500',    ring: 'ring-orange-400',   text: 'text-orange-300',    line: 'bg-orange-500/40' },
  VERIFIED:            { dot: 'bg-emerald-400',   ring: 'ring-emerald-400',  text: 'text-emerald-300',   line: 'bg-emerald-500/40' },
  SETTLED:             { dot: 'bg-emerald-500',   ring: 'ring-emerald-300',  text: 'text-emerald-200',   line: 'bg-emerald-500/60' },
};

export default function StateMachineStepper({ currentState }) {
  const currentIdx = STATE_STEPS.findIndex(s => s.key === currentState);

  return (
    <div style={{ padding: '12px 16px', background: 'rgba(15,23,42,0.7)', borderRadius: '12px', border: '1px solid rgba(51,65,85,0.5)' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' }}>
        Payment State Machine
      </div>

      {/* Horizontal stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '4px' }}>
        {STATE_STEPS.map((step, idx) => {
          const isPast    = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture  = idx > currentIdx;
          const colors    = STEP_COLORS[step.key];

          return (
            <React.Fragment key={step.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: '5px' }}>
                {/* Step dot */}
                <div
                  style={{
                    width: isCurrent ? '28px' : '20px',
                    height: isCurrent ? '28px' : '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isCurrent ? '9px' : '8px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s ease',
                    background: isPast
                      ? 'rgba(16,185,129,0.25)'
                      : isCurrent
                      ? undefined
                      : 'rgba(30,41,59,0.8)',
                    border: isCurrent
                      ? `2px solid ${step.key === 'MISMATCH_DETECTED' ? '#ef4444' : step.key === 'SETTLED' ? '#10b981' : '#6366f1'}`
                      : isPast
                      ? '2px solid rgba(16,185,129,0.5)'
                      : '2px solid rgba(51,65,85,0.6)',
                    color: isPast ? '#10b981' : isCurrent ? 'white' : '#475569',
                    boxShadow: isCurrent
                      ? `0 0 12px 2px ${step.key === 'MISMATCH_DETECTED' ? 'rgba(239,68,68,0.35)' : step.key === 'SETTLED' ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.35)'}`
                      : 'none',
                    animation: isCurrent && step.key !== 'SETTLED' ? 'pulse-subtle 1.8s ease-in-out infinite' : 'none',
                  }}
                >
                  {isPast ? '✓' : step.short}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent
                      ? (step.key === 'MISMATCH_DETECTED' ? '#fca5a5' : step.key === 'SETTLED' ? '#34d399' : '#a5b4fc')
                      : isPast
                      ? '#34d399'
                      : '#475569',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    maxWidth: '52px',
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line between steps */}
              {idx < STATE_STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    minWidth: '8px',
                    marginBottom: '16px',
                    background: idx < currentIdx
                      ? 'rgba(16,185,129,0.5)'
                      : 'rgba(51,65,85,0.4)',
                    transition: 'background 0.4s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
