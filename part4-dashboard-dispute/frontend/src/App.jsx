import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FileWarning, Activity, BarChart2,
  ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Info,
} from 'lucide-react';

import StatsOverview   from './components/StatsOverview.jsx';
import TransactionTable from './components/TransactionTable.jsx';
import DisputePanel    from './components/DisputePanel.jsx';
import AuditViewer     from './components/AuditViewer.jsx';
import AnalyticsPanel  from './components/AnalyticsPanel.jsx';
import FileDisputeModal from './components/FileDisputeModal.jsx';

import {
  fetchHealth,
  fetchSummary,
  fetchPassports,
  fetchAudit,
  fetchAllDisputes,
  fileDispute,
  updateDispute,
  resetDemo,
} from './api.js';

// ── Toast helper ─────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success:  { bg: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.5)',  text: '#34d399',  Icon: CheckCircle2 },
    error:    { bg: 'rgba(239,68,68,0.18)',   border: 'rgba(239,68,68,0.5)',   text: '#fca5a5',  Icon: AlertCircle },
    warning:  { bg: 'rgba(234,179,8,0.18)',   border: 'rgba(234,179,8,0.5)',   text: '#fde047',  Icon: AlertCircle },
    info:     { bg: 'rgba(51,65,85,0.7)',     border: 'rgba(51,65,85,0.7)',    text: '#cbd5e1',  Icon: Info },
  };
  const c = colors[toast.type] || colors.info;
  const Icon = c.Icon;
  return (
    <div
      className="animate-slide-in"
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 200,
        padding: '12px 18px', borderRadius: '12px', maxWidth: '420px',
        fontSize: '12px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        backdropFilter: 'blur(12px)',
      }}
    >
      <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
      {toast.message}
    </div>
  );
}

// ── Tab definitions ──────────────────────────────────────────────
const TABS = [
  { id: 'overview',      label: 'Overview',      Icon: LayoutDashboard },
  { id: 'transactions',  label: 'Transactions',  Icon: BarChart2 },
  { id: 'disputes',      label: 'Disputes',      Icon: FileWarning },
  { id: 'analytics',     label: 'Analytics',     Icon: BarChart2 },
  { id: 'audit',         label: 'Audit Trail',   Icon: Activity },
];

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('overview');

  // Data state
  const [backendOnline, setBackendOnline] = useState(null);
  const [summary, setSummary]     = useState(null);
  const [passports, setPassports] = useState([]);
  const [disputes, setDisputes]   = useState({ count: 0, disputes: [] });
  const [auditEvents, setAuditEvents] = useState([]);

  // UI state
  const [toast, setToast]         = useState(null);
  const [filingFor, setFilingFor] = useState(null); // passport_id being disputed
  const [filingLoading, setFilingLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Toast utility ─────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Refresh all data ─────────────────────────────────────────
  const refreshAll = useCallback(async (quiet = true) => {
    if (!quiet) setRefreshing(true);
    try {
      const [health, sum, pData, dData, aData] = await Promise.allSettled([
        fetchHealth(),
        fetchSummary(),
        fetchPassports(),
        fetchAllDisputes(),
        fetchAudit(),
      ]);

      setBackendOnline(health.status === 'fulfilled');

      if (sum.status === 'fulfilled')   setSummary(sum.value?.summary || null);
      if (pData.status === 'fulfilled') setPassports(pData.value?.passports || []);
      if (dData.status === 'fulfilled') setDisputes(dData.value || { count: 0, disputes: [] });
      if (aData.status === 'fulfilled') setAuditEvents(aData.value?.events || []);
    } catch (err) {
      setBackendOnline(false);
      console.error('Refresh error:', err);
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshAll(false);
    const iv = setInterval(() => refreshAll(true), 3000);
    return () => clearInterval(iv);
  }, [refreshAll]);

  // ── File dispute handler ──────────────────────────────────────
  const handleFileDispute = async (payload) => {
    setFilingLoading(true);
    try {
      const result = await fileDispute(payload);
      setFilingFor(null);
      await refreshAll(true);
      showToast(`✓ Dispute ${result.dispute?.dispute_id} filed successfully`, 'success');
    } catch (err) {
      showToast(`Failed to file dispute: ${err.message}`, 'error');
    } finally {
      setFilingLoading(false);
    }
  };

  // ── Update dispute handler ────────────────────────────────────
  const handleUpdateDispute = async (payload) => {
    try {
      const result = await updateDispute(payload);
      await refreshAll(true);
      const d = result.dispute;
      showToast(
        `Dispute ${d.dispute_id} → ${d.status}${d.resolution ? ` (${d.resolution})` : ''}`,
        d.status === 'RESOLVED' ? 'success' : 'info'
      );
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  // ── Reset handler ─────────────────────────────────────────────
  const handleReset = async () => {
    try {
      await resetDemo();
      await refreshAll(true);
      showToast('Part 4 dispute store reset', 'info');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    }
  };

  // ── Open dispute count for tab badge ─────────────────────────
  const openDisputeCount = disputes.disputes?.filter(
    d => d.status === 'OPEN' || d.status === 'INVESTIGATING'
  ).length || 0;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(51,65,85,0.55)',
        padding: '0 24px',
        height: '58px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>TrustBridge</h1>
              <span style={{
                fontSize: '9px', padding: '2px 8px', borderRadius: '999px', fontWeight: 700,
                background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)',
              }}>
                Part 4: Merchant Dashboard & Disputes
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#334155' }}>
              Analytics · Transaction Monitoring · Dispute Resolution · Evidence Viewer
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Backend status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: backendOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${backendOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#ef4444',
              animation: 'pulse-subtle 2s infinite',
            }} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: backendOnline ? '#34d399' : '#f87171' }}>
              {backendOnline === null ? 'Checking…' : backendOnline ? 'API :8002' : 'Offline'}
            </span>
          </div>

          {/* Refresh */}
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => refreshAll(false)}
            disabled={refreshing}
          >
            <RefreshCw style={{ width: 12, height: 12, animation: refreshing ? 'spin-slow 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          {/* Reset */}
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', fontSize: '11px', color: '#475569' }}
            onClick={handleReset}
          >
            Reset Disputes
          </button>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <div style={{
        background: 'rgba(15,23,42,0.6)',
        borderBottom: '1px solid rgba(51,65,85,0.4)',
        padding: '0 24px',
        display: 'flex', gap: '2px',
        position: 'sticky', top: '58px', zIndex: 20,
        backdropFilter: 'blur(8px)',
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          const badge = id === 'disputes' && openDisputeCount > 0 ? openDisputeCount : null;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '11px 16px',
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
                color: active ? '#a5b4fc' : '#475569',
                fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '6px',
                position: 'relative',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
              {badge && (
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '999px',
                  background: 'rgba(239,68,68,0.25)', color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.4)',
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toast ── */}
      <Toast toast={toast} />

      {/* ── File Dispute Modal ── */}
      {filingFor && (
        <FileDisputeModal
          passportId={filingFor}
          onClose={() => setFilingFor(null)}
          onSubmit={handleFileDispute}
          loading={filingLoading}
        />
      )}

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '20px 24px 32px', maxWidth: '1400px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="animate-fade-in">
            <StatsOverview summary={summary} disputes={disputes} backendOnline={backendOnline} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Recent Transactions */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '10px' }}>
                  Recent Transactions
                </div>
                <TransactionTable
                  passports={passports.slice(-5).reverse()}
                  onFileDispute={() => {}}
                  setFilingFor={setFilingFor}
                />
              </div>

              {/* Recent Disputes */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '10px' }}>
                  Recent Disputes
                </div>
                <DisputePanel
                  disputes={(disputes.disputes || []).slice(-3).reverse()}
                  onUpdateStatus={handleUpdateDispute}
                />
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <div className="animate-fade-in">
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '12px' }}>
              All Transactions — {passports.length} total
            </div>
            <TransactionTable
              passports={passports}
              onFileDispute={handleFileDispute}
              setFilingFor={setFilingFor}
            />
          </div>
        )}

        {/* DISPUTES */}
        {tab === 'disputes' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155' }}>
                Dispute Management — {disputes.count || 0} total
              </div>
              {openDisputeCount > 0 && (
                <div style={{
                  padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                  background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)',
                }}>
                  ⚠ {openDisputeCount} dispute{openDisputeCount > 1 ? 's' : ''} requiring attention
                </div>
              )}
            </div>
            <DisputePanel
              disputes={disputes.disputes || []}
              onUpdateStatus={handleUpdateDispute}
            />
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div className="animate-fade-in">
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '12px' }}>
              Merchant Analytics
            </div>
            <AnalyticsPanel summary={summary} />
          </div>
        )}

        {/* AUDIT */}
        {tab === 'audit' && (
          <div className="animate-fade-in">
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '12px' }}>
              System Audit Trail — {auditEvents.length} events (from Part 3)
            </div>
            <AuditViewer events={auditEvents} />
          </div>
        )}
      </main>
    </div>
  );
}
