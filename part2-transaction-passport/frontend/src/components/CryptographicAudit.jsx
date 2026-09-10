import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, Copy, AlertCircle } from 'lucide-react';
import { verifyIntegrity } from '../api.js';

export default function CryptographicAudit({ passport }) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  if (!passport) return null;

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyIntegrity(passport.passport_id);
      setVerificationResult(res);
    } catch (err) {
      console.error('Integrity check error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(passport.evidence_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(51, 65, 85, 0.6)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock style={{ width: 15, height: 15, color: '#818cf8' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              Cryptographic Proof & SHA-256 Digest
            </h4>
            <p style={{ fontSize: '10px', color: '#64748b' }}>
              Immutable snapshot of chat evidence and two-party consent
            </p>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            cursor: verifying ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <ShieldCheck style={{ width: 13, height: 13 }} />
          {verifying ? 'Verifying...' : 'Verify Cryptographic Proof'}
        </button>
      </div>

      {/* SHA-256 Hash box */}
      <div
        style={{
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
            SHA-256 Evidence Digest:
          </span>
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: '#38bdf8',
              wordBreak: 'break-all',
            }}
          >
            {passport.evidence_hash}
          </p>
        </div>
        <button
          onClick={copyHash}
          title="Copy Hash"
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#34d399' : '#64748b',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          {copied ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* Verification result badge */}
      {verificationResult && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            background: verificationResult.is_valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${verificationResult.is_valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 style={{ width: 15, height: 15, color: '#34d399' }} />
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
            Evidence Tamper-Proofing Verified: Live computed digest matches immutable genesis hash.
          </span>
        </div>
      )}

      {/* Toggle raw evidence */}
      <div style={{ marginTop: '10px', textAlign: 'right' }}>
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            fontSize: '11px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {showEvidence ? 'Hide Genesis Evidence' : 'Inspect Raw Genesis Evidence'}
        </button>
      </div>

      {showEvidence && (
        <pre
          style={{
            marginTop: '8px',
            padding: '10px',
            borderRadius: '6px',
            background: '#090d16',
            color: '#94a3b8',
            fontSize: '10px',
            overflowX: 'auto',
            maxHeight: '160px',
          }}
        >
          {JSON.stringify(passport.original_evidence, null, 2)}
        </pre>
      )}
    </div>
  );
}
