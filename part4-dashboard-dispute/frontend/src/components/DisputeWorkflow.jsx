import React, { useState } from 'react';
import {
  Scale,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  User,
  ArrowRight,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { fileDispute, reviewDispute, resolveDispute } from '../api.js';

export default function DisputeWorkflow({
  disputes = [],
  transactions = [],
  onRefresh,
  onOpenEvidence,
}) {
  const [selectedPassportId, setSelectedPassportId] = useState('TP-2026-8F42X91');
  const [claimText, setClaimText] = useState('I never received that ₹250 for the tea yesterday');
  const [defenseText, setDefenseText] = useState('I already paid you via UPI, check the transaction history');
  const [loading, setLoading] = useState(false);

  const handleFileDispute = async (e) => {
    e.preventDefault();
    if (!selectedPassportId) return;
    setLoading(true);
    try {
      await fileDispute(selectedPassportId, 'Riya', claimText, defenseText);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('File dispute error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (disputeId) => {
    try {
      await reviewDispute(disputeId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  const handleResolve = async (disputeId) => {
    try {
      await resolveDispute(
        disputeId,
        'Authoritative Mock UPI Gateway and Reconciliation audit confirm ₹250 was transferred. Dispute resolved.'
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Narrative Context Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale style={{ width: 18, height: 18, color: '#f43f5e' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
              The "He Said / She Said" Resolution Engine
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b' }}>
              Solving post-settlement disagreements with tamper-proof Transaction Passport evidence
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginTop: '10px' }}>
          Days after a payment is settled, Riya claims: <em style={{ color: '#fb7185' }}>"I never received that ₹250,"</em>{' '}
          while Arjun responds: <em style={{ color: '#818cf8' }}>"I already paid you."</em> Instead of arguing over chat screenshots,
          TrustBridge loads the complete chronological evidence timeline backed by cryptographic hashes.
        </p>

        {/* File Dispute Form */}
        <form onSubmit={handleFileDispute} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Target Transaction Passport:
              </label>
              <input
                type="text"
                value={selectedPassportId}
                onChange={(e) => setSelectedPassportId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#818cf8',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
                placeholder="TP-2026-XXXXXXX"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Dispute Initiator:
              </label>
              <input
                type="text"
                value="Riya (Lender / Receiver)"
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#fb7185', marginBottom: '4px', fontWeight: 600 }}>
                Riya's Claim (Non-receipt):
              </label>
              <input
                type="text"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#818cf8', marginBottom: '4px', fontWeight: 600 }}>
                Arjun's Defense (Payment Done):
              </label>
              <input
                type="text"
                value={defenseText}
                onChange={(e) => setDefenseText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              alignSelf: 'flex-start',
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#f43f5e',
              color: 'white',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',
            }}
          >
            <ShieldAlert style={{ width: 14, height: 14 }} />
            {loading ? 'Filing...' : 'Simulate Dispute Opening'}
          </button>
        </form>
      </div>

      {/* Active Disputes List */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Dispute Resolution Queue ({disputes.length})
        </h3>

        {disputes.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            No active disputes. File a dispute above to experience the verifiable evidence timeline!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {disputes.map((d) => {
              const isResolved = d.status === 'RESOLVED';
              const isReview = d.status === 'UNDER_REVIEW';

              return (
                <div
                  key={d.dispute_id}
                  style={{
                    background: '#090d16',
                    border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', fontSize: '13px' }}>
                        {d.dispute_id}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>·</span>
                      <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '12px' }}>
                        Passport: {d.passport_id}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontWeight: 800,
                        background: isResolved ? 'rgba(16, 185, 129, 0.2)' : isReview ? 'rgba(250, 204, 21, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                        color: isResolved ? '#34d399' : isReview ? '#facc15' : '#fb7185',
                      }}
                    >
                      {d.status}
                    </span>
                  </div>

                  {/* Claims */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', fontSize: '11px' }}>
                    <div style={{ background: '#111827', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#fb7185', fontWeight: 600 }}>Claim ({d.initiator}):</span>
                      <p style={{ color: '#f8fafc', marginTop: '2px' }}>"{d.claim_text}"</p>
                    </div>
                    <div style={{ background: '#111827', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>Defense ({d.respondent}):</span>
                      <p style={{ color: '#f8fafc', marginTop: '2px' }}>"{d.defense_text}"</p>
                    </div>
                  </div>

                  {/* Resolution Notes if resolved */}
                  {d.resolution_notes && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '11px', color: '#34d399' }}>
                      <strong>Resolution Verdict:</strong> {d.resolution_notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
                    <button
                      onClick={() => onOpenEvidence(d.passport_id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <FileCheck2 style={{ width: 13, height: 13 }} />
                      Dispute / View Evidence Timeline
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!isResolved && !isReview && (
                        <button
                          onClick={() => handleReview(d.dispute_id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#facc15',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Mark Under Review
                        </button>
                      )}

                      {!isResolved && (
                        <button
                          onClick={() => handleResolve(d.dispute_id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: '#059669',
                            border: 'none',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve via Authoritative Evidence
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
