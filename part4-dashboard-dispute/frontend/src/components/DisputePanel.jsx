import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, XCircle,
  MessageSquare, ShieldCheck, ChevronDown, ChevronRight,
  FileText, User,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────

function statusBadge(status) {
  const map = {
    OPEN:          { cls: 'badge-open',          icon: AlertTriangle,  label: 'Open' },
    INVESTIGATING: { cls: 'badge-investigating',  icon: Clock,          label: 'Investigating' },
    RESOLVED:      { cls: 'badge-resolved',       icon: CheckCircle2,   label: 'Resolved' },
    CLOSED:        { cls: 'badge-closed',         icon: XCircle,        label: 'Closed' },
  };
  return map[status] || map.CLOSED;
}

function resolutionBadge(resolution) {
  if (!resolution) return null;
  const map = {
    UPHELD:    { cls: 'badge-upheld',    label: 'Upheld' },
    DISMISSED: { cls: 'badge-dismissed', label: 'Dismissed' },
    PARTIAL:   { cls: 'badge-partial',   label: 'Partial' },
  };
  return map[resolution] || null;
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

function reasonLabel(r) {
  return (r || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Evidence section ─────────────────────────────────────────────
function EvidenceSection({ evidence, recon }) {
  if (!evidence?.length && !recon?.length) {
    return (
      <div style={{ fontSize: '11px', color: '#475569', padding: '10px 0' }}>
        No conversation evidence attached.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {evidence?.map((msg, i) => (
        <div key={i} className="evidence-bubble" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#a5b4fc' }}>
              <User style={{ width: 9, height: 9, display: 'inline', marginRight: '4px' }} />
              {msg.sender}
            </span>
            <span style={{ fontSize: '9px', color: '#334155' }}>{formatTime(msg.timestamp)}</span>
          </div>
          <div style={{ color: '#cbd5e1', lineHeight: 1.5 }}>{msg.text}</div>
        </div>
      ))}

      {recon?.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Reconciliation Checks
          </div>
          {recon.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 10px', borderRadius: '6px', marginBottom: '4px',
              background: c.passed ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
              border: `1px solid ${c.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              {c.passed
                ? <CheckCircle2 style={{ width: 11, height: 11, color: '#10b981', flexShrink: 0 }} />
                : <XCircle     style={{ width: 11, height: 11, color: '#ef4444', flexShrink: 0 }} />
              }
              <span style={{ fontSize: '10px', color: '#94a3b8', flex: 1 }}>{c.check_name}</span>
              <span style={{ fontSize: '9px', color: c.passed ? '#34d399' : '#fca5a5', fontWeight: 700 }}>
                {c.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single dispute row (expandable) ─────────────────────────────
function DisputeRow({ dispute, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState('UPHELD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const sb = statusBadge(dispute.status);
  const rb = resolutionBadge(dispute.resolution);
  const StatusIcon = sb.icon;

  const handleResolve = async () => {
    setLoading(true);
    await onUpdateStatus({
      dispute_id: dispute.dispute_id,
      status: 'RESOLVED',
      resolution,
      resolution_notes: notes || `Dispute ${resolution.toLowerCase()} by merchant reviewer.`,
    });
    setLoading(false);
    setResolving(false);
  };

  const handleClose = async () => {
    setLoading(true);
    await onUpdateStatus({
      dispute_id: dispute.dispute_id,
      status: 'CLOSED',
      resolution: 'DISMISSED',
      resolution_notes: 'Dispute closed — invalid or duplicate filing.',
    });
    setLoading(false);
  };

  const handleInvestigate = async () => {
    setLoading(true);
    await onUpdateStatus({
      dispute_id: dispute.dispute_id,
      status: 'INVESTIGATING',
    });
    setLoading(false);
  };

  return (
    <div
      className={`glass-card animate-fade-in ${dispute.status === 'OPEN' ? 'animate-dispute' : dispute.status === 'RESOLVED' ? 'animate-resolved' : ''}`}
      style={{ overflow: 'hidden', marginBottom: '10px' }}
    >
      {/* Row header — always visible */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Status icon */}
        <div style={{
          width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
          background: dispute.status === 'OPEN' ? 'rgba(239,68,68,0.15)'
            : dispute.status === 'INVESTIGATING' ? 'rgba(234,179,8,0.15)'
            : dispute.status === 'RESOLVED' ? 'rgba(16,185,129,0.15)'
            : 'rgba(100,116,139,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StatusIcon style={{
            width: 15, height: 15,
            color: dispute.status === 'OPEN' ? '#ef4444'
              : dispute.status === 'INVESTIGATING' ? '#f59e0b'
              : dispute.status === 'RESOLVED' ? '#10b981'
              : '#64748b',
          }} />
        </div>

        {/* ID + passport */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
              {dispute.dispute_id}
            </span>
            <span className={`${sb.cls}`} style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px' }}>
              {sb.label}
            </span>
            {rb && (
              <span className={`${rb.cls}`} style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px' }}>
                {rb.label}
              </span>
            )}
          </div>
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span>
              <span className="font-mono" style={{ color: '#6366f1' }}>{dispute.passport_id}</span>
            </span>
            <span>Filed by <strong style={{ color: '#94a3b8' }}>{dispute.filed_by}</strong></span>
            <span>{reasonLabel(dispute.reason)}</span>
            <span>{formatTime(dispute.filed_at)}</span>
          </div>
        </div>

        {/* Amount + expand toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          {dispute.claimed_amount != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fca5a5' }}>
                ₹{dispute.claimed_amount.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '9px', color: '#475569' }}>claimed</div>
            </div>
          )}
          {expanded
            ? <ChevronDown style={{ width: 14, height: 14, color: '#475569' }} />
            : <ChevronRight style={{ width: 14, height: 14, color: '#475569' }} />
          }
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="animate-slide-in"
          style={{ borderTop: '1px solid rgba(51,65,85,0.4)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Description */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '6px' }}>
              Description
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(30,41,59,0.4)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(51,65,85,0.3)' }}>
              {dispute.description}
            </div>
          </div>

          {/* IDs */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Passport ID', val: dispute.passport_id },
              { label: 'Settlement ID', val: dispute.settlement_id || '—' },
              { label: 'Payment Ref', val: dispute.payment_reference || '—' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '9px', color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{item.label}</div>
                <div className="font-mono" style={{ fontSize: '10px', color: '#a5b4fc' }}>{item.val}</div>
              </div>
            ))}
            {dispute.resolved_at && (
              <div>
                <div style={{ fontSize: '9px', color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Resolved At</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{formatTime(dispute.resolved_at)}</div>
              </div>
            )}
          </div>

          {/* Resolution notes */}
          {dispute.resolution_notes && (
            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Resolution Notes</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>{dispute.resolution_notes}</div>
            </div>
          )}

          {/* Conversation evidence */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MessageSquare style={{ width: 11, height: 11 }} />
              Conversation Evidence & Reconciliation Checks
            </div>
            <EvidenceSection
              evidence={dispute.conversation_evidence}
              recon={dispute.reconciliation_checks}
            />
          </div>

          {/* Action buttons — only for active disputes */}
          {(dispute.status === 'OPEN' || dispute.status === 'INVESTIGATING') && (
            <div style={{ borderTop: '1px solid rgba(51,65,85,0.3)', paddingTop: '14px' }}>
              {!resolving ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {dispute.status === 'OPEN' && (
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '11px', padding: '7px 14px' }}
                      onClick={handleInvestigate}
                      disabled={loading}
                    >
                      {loading ? '…' : '🔍 Begin Investigation'}
                    </button>
                  )}
                  <button
                    className="btn-success"
                    style={{ fontSize: '11px', padding: '7px 14px' }}
                    onClick={() => setResolving(true)}
                    disabled={loading}
                  >
                    ✓ Resolve Dispute
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '7px 14px', color: '#64748b' }}
                    onClick={handleClose}
                    disabled={loading}
                  >
                    ✕ Close (Invalid)
                  </button>
                </div>
              ) : (
                <div
                  className="animate-slide-in"
                  style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>Resolve Dispute</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['UPHELD', 'DISMISSED', 'PARTIAL'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResolution(r)}
                        style={{
                          flex: 1, padding: '6px', borderRadius: '7px',
                          border: '1px solid', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                          background: resolution === r ? 'rgba(16,185,129,0.2)' : 'rgba(30,41,59,0.5)',
                          borderColor: resolution === r ? 'rgba(16,185,129,0.5)' : 'rgba(51,65,85,0.5)',
                          color: resolution === r ? '#34d399' : '#475569',
                          transition: 'all 0.15s',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Resolution notes (optional)..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', resize: 'vertical',
                      background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.5)',
                      borderRadius: '7px', color: '#f1f5f9', fontSize: '11px',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setResolving(false)}>
                      Cancel
                    </button>
                    <button className="btn-success" style={{ fontSize: '11px', padding: '6px 14px' }} onClick={handleResolve} disabled={loading}>
                      {loading ? 'Saving…' : 'Confirm Resolution'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dispute Panel (full list) ────────────────────────────────────
export default function DisputePanel({ disputes, onUpdateStatus }) {
  const [filter, setFilter] = useState('ALL');

  const FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Investigating', value: 'INVESTIGATING' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  const filtered = filter === 'ALL'
    ? (disputes || [])
    : (disputes || []).filter(d => d.status === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', borderBottom: '1px solid rgba(51,65,85,0.4)', paddingBottom: '0' }}>
        {FILTERS.map(f => {
          const count = f.value === 'ALL'
            ? (disputes || []).length
            : (disputes || []).filter(d => d.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: filter === f.value ? '2px solid #6366f1' : '2px solid transparent',
                color: filter === f.value ? '#a5b4fc' : '#475569',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {f.label}
              {count > 0 && (
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '999px',
                  background: f.value === 'OPEN' ? 'rgba(239,68,68,0.2)' : 'rgba(51,65,85,0.5)',
                  color: f.value === 'OPEN' ? '#fca5a5' : '#64748b',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dispute list */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
          <FileText style={{ width: 32, height: 32, marginBottom: '12px', opacity: 0.4 }} />
          <div style={{ fontSize: '13px', fontWeight: 600 }}>
            {filter === 'ALL' ? 'No disputes filed yet' : `No ${filter.toLowerCase()} disputes`}
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            {filter === 'ALL' ? 'File a dispute from the Transactions tab against a settled passport' : 'Change filter to see other disputes'}
          </div>
        </div>
      ) : (
        filtered.map(d => (
          <DisputeRow key={d.dispute_id} dispute={d} onUpdateStatus={onUpdateStatus} />
        ))
      )}
    </div>
  );
}
