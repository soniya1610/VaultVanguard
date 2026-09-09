import React, { useState } from 'react';
import { X, AlertTriangle, MessageSquare, ShieldCheck, ChevronDown } from 'lucide-react';

const REASONS = [
  { value: 'AMOUNT_MISMATCH',  label: 'Amount Mismatch',  desc: 'The charged amount differs from the agreed amount' },
  { value: 'UNAUTHORIZED',     label: 'Unauthorized',      desc: 'Transaction was not authorised by me' },
  { value: 'DOUBLE_CHARGE',    label: 'Double Charge',     desc: 'I was charged twice for the same transaction' },
  { value: 'NOT_RECEIVED',     label: 'Not Received',      desc: 'Payment was deducted but receiver has not received funds' },
  { value: 'WRONG_RECEIVER',   label: 'Wrong Receiver',    desc: 'Funds were sent to the wrong party' },
  { value: 'OTHER',            label: 'Other',             desc: 'Other reason not listed above' },
];

export default function FileDisputeModal({ passportId, onClose, onSubmit, loading }) {
  const [reason, setReason] = useState('AMOUNT_MISMATCH');
  const [description, setDescription] = useState('');
  const [filedBy, setFiledBy] = useState('Arjun');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [error, setError] = useState('');

  const selectedReason = REASONS.find(r => r.value === reason);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the dispute.');
      return;
    }
    setError('');
    await onSubmit({
      passport_id: passportId,
      filed_by: filedBy,
      reason,
      description: description.trim(),
      claimed_amount: claimedAmount ? parseFloat(claimedAmount) : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="glass-card animate-slide-in"
        style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(51,65,85,0.5)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '8px',
                background: 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle style={{ width: 14, height: 14, color: '#ef4444' }} />
              </div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9' }}>File a Dispute</h2>
            </div>
            <p style={{ fontSize: '10px', color: '#475569' }}>
              Against passport{' '}
              <span className="font-mono" style={{ color: '#a5b4fc', fontSize: '9px' }}>{passportId}</span>
            </p>
          </div>
          <button
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: '8px', lineHeight: 0 }}
            onClick={onClose}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Evidence notice */}
        <div style={{
          margin: '16px 24px 0',
          padding: '10px 14px',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '10px',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}>
          <MessageSquare style={{ width: 13, height: 13, color: '#6366f1', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#a5b4fc' }}>Conversation evidence will be automatically attached</strong> —
            the original chat messages from Part 1 and reconciliation checks from Part 3 are pulled into this dispute record.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Filed by */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Filed By
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Arjun', 'Riya'].map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFiledBy(name)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: filedBy === name ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.5)',
                    borderColor: filedBy === name ? 'rgba(99,102,241,0.6)' : 'rgba(51,65,85,0.5)',
                    color: filedBy === name ? '#a5b4fc' : '#64748b',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Dispute Reason
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 32px 10px 12px',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(51,65,85,0.6)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {REASONS.map(r => (
                  <option key={r.value} value={r.value} style={{ background: '#0f172a' }}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown style={{ width: 12, height: 12, color: '#475569', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            {selectedReason && (
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '5px' }}>
                {selectedReason.desc}
              </div>
            )}
          </div>

          {/* Claimed amount */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Claimed Amount (₹) — optional
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 200"
              value={claimedAmount}
              onChange={e => setClaimedAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(51,65,85,0.6)',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
              Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue with this transaction..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(15,23,42,0.8)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(51,65,85,0.6)'}`,
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            {error && <div style={{ fontSize: '10px', color: '#f87171', marginTop: '4px' }}>{error}</div>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '9px 18px', fontSize: '12px' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              style={{ padding: '9px 20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={loading}
            >
              <AlertTriangle style={{ width: 12, height: 12 }} />
              {loading ? 'Filing...' : 'File Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
