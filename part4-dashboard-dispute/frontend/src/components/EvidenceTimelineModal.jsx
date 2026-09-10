import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Scale
} from 'lucide-react';

export default function EvidenceTimelineModal({ isOpen, onClose, evidencePackage }) {
  if (!isOpen || !evidencePackage) return null;

  const {
    passport_id,
    original_agreement,
    mutual_confirmation,
    payment_attempt,
    gateway_evidence,
    merchant_evidence,
    reconciliation_verdict,
    final_state,
    evidence_hash,
    items = [],
  } = evidencePackage;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          maxWidth: '820px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale style={{ width: 18, height: 18, color: '#34d399' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                Dispute Evidence Package · {passport_id}
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Structured chronological verification solving "He Said / She Said" disputes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Executive Summary Card (Human-Readable Translation) */}
          <div
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <ShieldCheck style={{ width: 16, height: 16, color: '#38bdf8' }} />
              <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verified Human-Readable Findings
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
              <div style={{ background: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Original Agreement:</span>
                <p style={{ color: '#f1f5f9', fontWeight: 600, marginTop: '2px' }}>{original_agreement}</p>
              </div>

              <div style={{ background: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Mutual Confirmation:</span>
                <p style={{ color: '#34d399', fontWeight: 600, marginTop: '2px' }}>{mutual_confirmation}</p>
              </div>

              <div style={{ background: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Payment Attempt:</span>
                <p style={{ color: '#60a5fa', fontWeight: 600, marginTop: '2px' }}>{payment_attempt}</p>
              </div>

              <div style={{ background: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Gateway Evidence:</span>
                <p style={{ color: '#10b981', fontWeight: 700, marginTop: '2px' }}>{gateway_evidence}</p>
              </div>

              <div style={{ background: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Merchant Evidence:</span>
                <p style={{ color: '#fb923c', fontWeight: 600, marginTop: '2px' }}>{merchant_evidence}</p>
              </div>

              <div style={{ background: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Reconciliation:</span>
                <p style={{ color: '#facc15', fontWeight: 600, marginTop: '2px' }}>{reconciliation_verdict}</p>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
                Authoritative Final State:
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>
                {final_state}
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Digest Box */}
          <div
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                Cryptographic Audit Hash (SHA-256):
              </span>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#38bdf8', wordBreak: 'break-all' }}>
                {evidence_hash}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '11px', fontWeight: 700 }}>
              <Lock style={{ width: 14, height: 14 }} />
              <span>Immutable</span>
            </div>
          </div>

          {/* Chronological Evidence Stages */}
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>
              Chronological Audit Trail
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                        {item.stage}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      {item.human_readable_verdict}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: 700, marginLeft: '12px' }}>
                    <CheckCircle2 style={{ width: 14, height: 14 }} />
                    <span>Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#334155',
              color: 'white',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close Evidence Package
          </button>
        </div>
      </div>
    </div>
  );
}
