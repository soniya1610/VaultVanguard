import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Scale,
  RefreshCw,
  Zap,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import MerchantDashboard from './components/MerchantDashboard.jsx';
import DisputeWorkflow from './components/DisputeWorkflow.jsx';
import EvidenceTimelineModal from './components/EvidenceTimelineModal.jsx';
import {
  fetchHealth,
  fetchMerchantDashboard,
  fetchDisputes,
  fetchEvidence,
  seedDemo,
  resetDemo,
} from './api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'disputes'
  const [dashboardData, setDashboardData] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [backendOnline, setBackendOnline] = useState(null);
  const [selectedEvidencePackage, setSelectedEvidencePackage] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const health = await fetchHealth().catch(() => null);
      setBackendOnline(!!health);

      const dData = await fetchMerchantDashboard().catch(() => null);
      if (dData) setDashboardData(dData);

      const disp = await fetchDisputes().catch(() => ({ disputes: [] }));
      setDisputes(disp.disputes || []);
    } catch (err) {
      console.error('Part 4 loadData error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleOpenEvidence = async (passportId) => {
    try {
      const res = await fetchEvidence(passportId);
      setSelectedEvidencePackage(res.evidence_package);
      setIsEvidenceModalOpen(true);
    } catch (err) {
      showToast(`Failed to load evidence for ${passportId}`, 'error');
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedDemo();
      await loadData();
      showToast('✓ Seeded Demo: PENDING ₹250 Contradiction ready', 'success');
    } catch (err) {
      showToast(`Seed failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo();
      await loadData();
      showToast('Part 4 store cleared', 'info');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Monorepo Ecosystem Quick Nav ── */}
      <div
        style={{
          background: '#090d16',
          borderBottom: '1px solid #1f2937',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6b7280', fontWeight: 600 }}>TrustBridge Monorepo:</span>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px' }}
          >
            Part 1: Chat & Consent (:5173) ↗
          </a>
          <a
            href="http://localhost:5175"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px' }}
          >
            Part 2: Passport & State (:5175) ↗
          </a>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '2px 8px', borderRadius: '4px' }}
          >
            Part 3: Payment & Reconcile (:5174) ↗
          </a>
          <span
            style={{
              background: 'rgba(234, 88, 12, 0.2)',
              color: '#fb923c',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              border: '1px solid rgba(234, 88, 12, 0.4)',
            }}
          >
            Part 4: Merchant & Dispute (:5176) [Active]
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#ef4444',
            }}
          />
          <span style={{ color: backendOnline ? '#34d399' : '#f87171', fontWeight: 600 }}>
            {backendOnline ? 'Backend Online (:8003)' : 'Backend Offline'}
          </span>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
          padding: '0 24px',
          height: '62px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ea580c, #f43f5e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                TrustBridge
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  background: 'rgba(234, 88, 12, 0.2)',
                  color: '#fb923c',
                  border: '1px solid rgba(234, 88, 12, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                Part 4: Merchant Dashboard & Dispute Resolution
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#64748b' }}>
              Riya's Dashboard · Downstream Contradiction Demonstration · He-Said/She-Said Dispute Resolution
            </p>
          </div>
        </div>

        {/* Tab switcher + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div style={{ display: 'flex', background: '#090d16', padding: '3px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                background: activeTab === 'dashboard' ? '#1e293b' : 'transparent',
                color: activeTab === 'dashboard' ? '#fb923c' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LayoutDashboard style={{ width: 13, height: 13 }} />
              Merchant Dashboard (Riya)
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: 'none',
                background: activeTab === 'disputes' ? '#1e293b' : 'transparent',
                color: activeTab === 'disputes' ? '#fb7185' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Scale style={{ width: 13, height: 13 }} />
              Disputes & Evidence ({disputes.length})
            </button>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: 'rgba(234, 88, 12, 0.2)',
              color: '#fb923c',
              border: '1px solid rgba(234, 88, 12, 0.4)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap style={{ width: 13, height: 13 }} />
            Seed Demo (Lag Mode)
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              background: 'rgba(51, 65, 85, 0.4)',
              color: '#94a3b8',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw style={{ width: 12, height: 12 }} />
          </button>

        </div>
      </header>

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '75px',
            right: '24px',
            zIndex: 999,
            padding: '10px 16px',
            borderRadius: '8px',
            background: toast.type === 'success' ? '#065f46' : '#1e293b',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Main Workspace ── */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'dashboard' ? (
          <MerchantDashboard
            dashboardData={dashboardData}
            onRefresh={loadData}
            onViewEvidence={handleOpenEvidence}
          />
        ) : (
          <DisputeWorkflow
            disputes={disputes}
            transactions={dashboardData?.transactions || []}
            onRefresh={loadData}
            onOpenEvidence={handleOpenEvidence}
          />
        )}
      </main>

      {/* ── Evidence Timeline Modal ── */}
      <EvidenceTimelineModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        evidencePackage={selectedEvidencePackage}
      />

    </div>
  );
}
