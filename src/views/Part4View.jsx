import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Scale,
  RefreshCw,
  Zap,
  RotateCcw,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import MerchantDashboard from '../../part4-dashboard-dispute/frontend/src/components/MerchantDashboard.jsx';
import DisputeWorkflow from '../../part4-dashboard-dispute/frontend/src/components/DisputeWorkflow.jsx';
import EvidenceTimelineModal from '../../part4-dashboard-dispute/frontend/src/components/EvidenceTimelineModal.jsx';
import { p4Api } from '../services/apiAdapter.js';
import { trustbridgeEngine } from '../services/trustbridgeEngine.js';

export default function Part4View({ onNavigatePart }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'disputes'
  const [dashboardData, setDashboardData] = useState(null);
  const [disputes, setDisputes] = useState([]);
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
      const dData = await p4Api.fetchMerchantDashboard();
      if (dData) setDashboardData(dData);

      const disp = await p4Api.fetchDisputes();
      setDisputes(disp.disputes || []);
    } catch (err) {
      console.error('Part 4 loadData error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = trustbridgeEngine.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const handleOpenEvidence = async (passportId) => {
    try {
      const res = await p4Api.fetchEvidence(passportId);
      setSelectedEvidencePackage(res.evidence_package);
      setIsEvidenceModalOpen(true);
    } catch (err) {
      showToast(`Failed to load evidence for ${passportId}`, 'error');
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await p4Api.seedDemo();
      await loadData();
      showToast('✓ Seeded Demo: Contradiction & Dispute ready', 'success');
    } catch (err) {
      showToast(`Seed failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await p4Api.resetDemo();
      await loadData();
      showToast('Part 4 store cleared', 'info');
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Action Controls & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Merchant Dashboard (Riya)</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'disputes'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Dispute Resolution ("He Said / She Said")</span>
            {disputes.length > 0 && (
              <span className="bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded-full text-[10px]">
                {disputes.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Seed Contradiction</span>
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="p-3 rounded-lg text-xs font-semibold shadow-lg transition-all animate-slide-in bg-slate-800 border border-slate-700 text-slate-200">
          {toast.msg}
        </div>
      )}

      {/* Tab Content */}
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

      {/* Verifiable Evidence Dossier Modal */}
      {isEvidenceModalOpen && (
        <EvidenceTimelineModal
          evidencePackage={selectedEvidencePackage}
          onClose={() => setIsEvidenceModalOpen(false)}
        />
      )}
    </div>
  );
}
