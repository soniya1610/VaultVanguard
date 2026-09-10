import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  CreditCard,
  Building,
  ArrowUpRight
} from 'lucide-react';
import { syncMerchantStatus } from '../api.js';

export default function MerchantDashboard({
  dashboardData,
  onRefresh,
  onViewEvidence,
}) {
  const [syncingId, setSyncingId] = useState(null);

  if (!dashboardData) return null;

  const { summary, transactions = [] } = dashboardData;
  const hasContradiction = summary?.has_stale_contradiction;

  const handleSimulateReconciliationSync = async (passportId) => {
    setSyncingId(passportId);
    try {
      await syncMerchantStatus(passportId, 'SETTLED');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Deliberate Live Demo Failure Contradiction Banner */}
      {hasContradiction && (
        <div
          className="animate-mismatch"
          style={{
            background: 'rgba(234, 88, 12, 0.15)',
            border: '2px solid rgba(249, 115, 22, 0.7)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle style={{ width: 22, height: 22, color: '#fb923c' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#ffedd5' }}>
                  Deliberate Live-Demo Contradiction Active!
                </h4>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#ea580c',
                    color: 'white',
                    fontWeight: 800,
                  }}
                >
                  GATEWAY: SUCCESS vs DASHBOARD: PENDING
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#fed7aa', marginTop: '2px', lineHeight: '1.4' }}>
                The Mock UPI Gateway has confirmed receipt of ₹250.00, but Riya's dashboard is intentionally
                delayed at PENDING. Run the Reconciliation Engine (Part 3) to correct this state in real time!
              </p>
            </div>
          </div>

          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#ea580c',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
              flexShrink: 0,
            }}
          >
            Reconcile in Part 3
            <ArrowUpRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      )}

      {/* Summary Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Lender Account
          </span>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            Riya (tea credit)
          </h3>
          <span style={{ fontSize: '11px', color: '#38bdf8' }}>Active Creditor</span>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(51, 65, 85, 0.6)',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Obligations
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
            {summary?.total_transactions || 0}
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Recorded Passports</span>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${hasContradiction ? 'rgba(249, 115, 22, 0.6)' : 'rgba(51, 65, 85, 0.6)'}`,
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#fb923c', textTransform: 'uppercase', fontWeight: 700 }}>
            Pending Downstream
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fb923c', marginTop: '4px' }}>
            ₹{(summary?.pending_amount || 0).toFixed(2)}
          </h3>
          <span style={{ fontSize: '11px', color: '#fdba74' }}>
            {summary?.pending_count || 0} awaiting sync
          </span>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
            Settled in Ledger
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            ₹{(summary?.settled_amount || 0).toFixed(2)}
          </h3>
          <span style={{ fontSize: '11px', color: '#6ee7b7' }}>
            {summary?.settled_count || 0} verified & settled
          </span>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(51, 65, 85, 0.6)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              Riya's Merchant Ledger
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b' }}>
              Real-time synchronization between payment gateway and creditor records
            </p>
          </div>

          <button
            onClick={onRefresh}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw style={{ width: 12, height: 12 }} />
            Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            No merchant records found. Seed demo or initiate transaction in Part 1/3.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Passport ID</th>
                <th style={{ padding: '10px 12px' }}>Payer</th>
                <th style={{ padding: '10px 12px' }}>Purpose</th>
                <th style={{ padding: '10px 12px' }}>Amount</th>
                <th style={{ padding: '10px 12px' }}>Dashboard Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isPending = tx.status === 'PENDING';
                return (
                  <tr
                    key={tx.passport_id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      background: isPending ? 'rgba(234, 88, 12, 0.05)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#818cf8' }}>
                      {tx.passport_id}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{tx.payer}</td>
                    <td style={{ padding: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{tx.purpose}</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#facc15' }}>
                      ₹{tx.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '10px',
                          fontWeight: 800,
                          background: isPending ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isPending ? '#fb923c' : '#34d399',
                          border: `1px solid ${isPending ? 'rgba(249, 115, 22, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        }}
                      >
                        {tx.status} {isPending && '(LAG)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {isPending && (
                          <button
                            onClick={() => handleSimulateReconciliationSync(tx.passport_id)}
                            disabled={syncingId === tx.passport_id}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#34d399',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {syncingId === tx.passport_id ? 'Syncing...' : 'Sync to Settled'}
                          </button>
                        )}
                        <button
                          onClick={() => onViewEvidence(tx.passport_id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#94a3b8',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye style={{ width: 12, height: 12 }} />
                          View Evidence
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
