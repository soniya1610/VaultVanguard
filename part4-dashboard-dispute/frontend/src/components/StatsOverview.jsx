import React from 'react';
import {
  ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Banknote, FileWarning, Activity,
} from 'lucide-react';

const stats = (summary, disputes) => [
  {
    label: 'Total Volume',
    value: `₹${(summary?.total_volume_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    sub: `${summary?.total_passports || 0} passports`,
    icon: Banknote,
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.2)',
  },
  {
    label: 'Settled',
    value: summary?.total_settled || 0,
    sub: `₹${(summary?.settled_volume_inr || 0).toLocaleString('en-IN')} cleared`,
    icon: CheckCircle2,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.2)',
  },
  {
    label: 'Pending',
    value: summary?.total_pending || 0,
    sub: 'awaiting settlement',
    icon: Clock,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.2)',
  },
  {
    label: 'Open Disputes',
    value: summary?.open_disputes || 0,
    sub: `${summary?.resolved_disputes || 0} resolved`,
    icon: AlertTriangle,
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.2)',
    pulse: (summary?.open_disputes || 0) > 0,
  },
  {
    label: 'Total Disputes',
    value: disputes?.count || 0,
    sub: 'all time',
    icon: FileWarning,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
  },
  {
    label: 'System Health',
    value: 'LIVE',
    sub: 'Part 3 connected',
    icon: Activity,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.2)',
  },
];

export default function StatsOverview({ summary, disputes, backendOnline }) {
  const items = stats(summary, disputes);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    }}>
      {items.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={i}
            className="glass-card stat-card animate-count"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animationDelay: `${i * 60}ms`,
              border: s.pulse ? '1px solid rgba(239,68,68,0.5)' : undefined,
              animation: s.pulse
                ? 'dispute-flash 1.8s ease-in-out infinite, count-up 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both'
                : undefined,
            }}
          >
            {/* Icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569' }}>
                {s.label}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: '8px',
                background: s.glow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 14, height: 14, color: s.color }} />
              </div>
            </div>

            {/* Value */}
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value === 'LIVE' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="animate-pulse-subtle"
                    style={{ width: 8, height: 8, borderRadius: '50%', background: backendOnline ? '#10b981' : '#ef4444', display: 'inline-block' }}
                  />
                  {backendOnline ? 'LIVE' : 'OFFLINE'}
                </span>
              ) : s.value}
            </div>

            {/* Sub */}
            <div style={{ fontSize: '10px', color: '#475569' }}>{s.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
