import React from 'react';
import { TrendingUp, Users, Tag } from 'lucide-react';
import { PurposeChart, DailyVolumeChart } from './TransactionTable.jsx';

function LeaderboardRow({ rank, name, volume, max }) {
  const pct = max > 0 ? (volume / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <div style={{ width: '16px', fontSize: '10px', fontWeight: 800, color: '#334155', textAlign: 'center' }}>
        {rank}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>{name}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
            ₹{volume.toLocaleString('en-IN')}
          </span>
        </div>
        <div style={{ height: '4px', background: 'rgba(51,65,85,0.5)', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #6366f1, #10b981)',
              borderRadius: '2px',
              transition: 'width 0.8s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ summary }) {
  const topPayers   = summary?.top_payers   || [];
  const topReceivers = summary?.top_receivers || [];
  const purposeBreakdown = summary?.purpose_breakdown || {};
  const dailyVolume = summary?.daily_volume || [];

  const maxPayer    = topPayers[0]?.volume    || 1;
  const maxReceiver = topReceivers[0]?.volume || 1;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

      {/* Daily Volume Chart */}
      <div className="glass-card" style={{ padding: '16px', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <TrendingUp style={{ width: 13, height: 13, color: '#6366f1' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Daily Transaction Volume (INR)</span>
        </div>
        {dailyVolume.length === 0 ? (
          <div style={{ color: '#334155', fontSize: '11px', padding: '24px 0', textAlign: 'center' }}>
            No volume data yet — process transactions in Part 3
          </div>
        ) : (
          <DailyVolumeChart dailyVolume={dailyVolume} />
        )}
      </div>

      {/* Top Payers */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <Users style={{ width: 13, height: 13, color: '#8b5cf6' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Top Payers</span>
        </div>
        {topPayers.length === 0
          ? <div style={{ color: '#334155', fontSize: '11px' }}>No data yet</div>
          : topPayers.map((p, i) => (
              <LeaderboardRow key={p.name} rank={i + 1} name={p.name} volume={p.volume} max={maxPayer} />
            ))
        }
      </div>

      {/* Top Receivers */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <Users style={{ width: 13, height: 13, color: '#10b981' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Top Receivers</span>
        </div>
        {topReceivers.length === 0
          ? <div style={{ color: '#334155', fontSize: '11px' }}>No data yet</div>
          : topReceivers.map((r, i) => (
              <LeaderboardRow key={r.name} rank={i + 1} name={r.name} volume={r.volume} max={maxReceiver} />
            ))
        }
      </div>

      {/* Purpose Breakdown */}
      <div className="glass-card" style={{ padding: '16px', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
          <Tag style={{ width: 13, height: 13, color: '#f59e0b' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>Transaction Purpose Breakdown</span>
        </div>
        <PurposeChart breakdown={purposeBreakdown} />
      </div>
    </div>
  );
}
