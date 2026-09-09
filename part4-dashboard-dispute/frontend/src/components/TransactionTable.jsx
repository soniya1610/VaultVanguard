import React, { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────

function getStateClass(state) {
  const s = (state || '').toLowerCase();
  if (s === 'settled') return 'state-settled';
  if (s === 'verified') return 'state-verified';
  if (s === 'reconciling') return 'state-reconciling';
  if (s.includes('mismatch')) return 'state-mismatch';
  if (s === 'payment_processed') return 'state-payment-processed';
  if (s === 'payment_pending') return 'state-payment-pending';
  if (s === 'payment_initiated') return 'state-payment-initiated';
  return 'state-confirmed';
}

function formatTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso.slice(0, 16); }
}

// ── Mini bar chart for purpose breakdown ──────────────────────────
function PurposeChart({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return <div style={{ color: '#475569', fontSize: '11px', padding: '8px 0' }}>No data yet</div>;
  }
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...entries.map(e => e[1]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([purpose, count]) => (
        <div key={purpose} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '60px', fontSize: '10px', color: '#64748b', textTransform: 'capitalize', flexShrink: 0 }}>
            {purpose}
          </div>
          <div style={{ flex: 1, height: '6px', background: 'rgba(51,65,85,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: '3px',
                transition: 'width 0.8s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', width: '16px', textAlign: 'right' }}>{count}</div>
        </div>
      ))}
    </div>
  );
}

// ── Daily volume bar chart ────────────────────────────────────────
function DailyVolumeChart({ dailyVolume }) {
  if (!dailyVolume || dailyVolume.length === 0) {
    return <div style={{ color: '#475569', fontSize: '11px', padding: '8px 0' }}>No volume data yet</div>;
  }
  const max = Math.max(...dailyVolume.map(d => d.volume), 1);
  const CHART_HEIGHT = 80;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${CHART_HEIGHT + 20}px`, paddingTop: '4px' }}>
      {dailyVolume.map((d, i) => {
        const barH = Math.max(4, (d.volume / max) * CHART_HEIGHT);
        const label = d.date.slice(5); // MM-DD
        return (
          <div
            key={i}
            title={`${d.date}: ₹${d.volume}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'default',
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${barH}px`,
                background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.6s ease',
                opacity: 0.85,
              }}
            />
            <div style={{ fontSize: '8px', color: '#334155', whiteSpace: 'nowrap', transform: 'rotate(-45deg)', transformOrigin: 'top center' }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Transaction table ─────────────────────────────────────────────
export default function TransactionTable({ passports, onFileDispute, filingFor, setFilingFor }) {
  if (!passports || passports.length === 0) {
    return (
      <div
        className="glass-card"
        style={{ padding: '40px', textAlign: 'center', color: '#475569' }}
      >
        <BarChart2 style={{ width: 32, height: 32, marginBottom: '12px', opacity: 0.4 }} />
        <div style={{ fontSize: '13px', fontWeight: 600 }}>No transactions yet</div>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>Seed a demo in Part 3, then refresh here</div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(51,65,85,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <BarChart2 style={{ width: 14, height: 14, color: '#6366f1' }} />
          All Transactions ({passports.length})
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
              {['Passport ID', 'Payer', 'Receiver', 'Amount', 'Purpose', 'State', 'Updated', 'Disputes', 'Action'].map(h => (
                <th key={h} style={{
                  padding: '8px 14px', textAlign: 'left',
                  color: '#475569', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '9px', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {passports.map((entry, i) => {
              const p = entry.passport || {};
              const hasDispute = entry.has_dispute;
              const openD = entry.open_dispute_count || 0;
              return (
                <tr
                  key={p.passport_id || i}
                  style={{
                    borderBottom: '1px solid rgba(30,41,59,0.6)',
                    background: hasDispute ? 'rgba(239,68,68,0.03)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(51,65,85,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = hasDispute ? 'rgba(239,68,68,0.03)' : 'transparent'}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span className="font-mono" style={{ fontSize: '10px', color: '#a5b4fc' }}>
                      {p.passport_id || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 500 }}>{p.payer || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{p.receiver || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#34d399', fontWeight: 700 }}>
                    ₹{(p.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b', textTransform: 'capitalize' }}>{p.purpose || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      className={`${getStateClass(p.state)}`}
                      style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', border: '1px solid', whiteSpace: 'nowrap' }}
                    >
                      {p.state || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {formatTime(p.updated_at)}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {hasDispute ? (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px',
                        background: openD > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)',
                        color: openD > 0 ? '#fca5a5' : '#34d399',
                        border: `1px solid ${openD > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
                      }}>
                        {openD > 0 ? `${openD} open` : '✓ resolved'}
                      </span>
                    ) : (
                      <span style={{ color: '#1e293b', fontSize: '10px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {p.state === 'SETTLED' && (
                      <button
                        className="btn-danger"
                        style={{ fontSize: '10px', padding: '4px 10px' }}
                        onClick={() => setFilingFor(p.passport_id)}
                      >
                        File Dispute
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { PurposeChart, DailyVolumeChart };
