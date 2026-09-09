const API_BASE = '/api';

// ── Health ────────────────────────────────────────────────────────
export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend offline');
  return res.json();
}

// ── Dashboard ─────────────────────────────────────────────────────
export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchPassports() {
  const res = await fetch(`${API_BASE}/dashboard/passports`);
  if (!res.ok) throw new Error('Failed to fetch passports');
  return res.json();
}

export async function fetchSettlements() {
  const res = await fetch(`${API_BASE}/dashboard/settlements`);
  if (!res.ok) throw new Error('Failed to fetch settlements');
  return res.json();
}

export async function fetchAudit() {
  const res = await fetch(`${API_BASE}/dashboard/audit`);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
}

// ── Disputes ──────────────────────────────────────────────────────
export async function fetchAllDisputes() {
  const res = await fetch(`${API_BASE}/dispute/all`);
  if (!res.ok) throw new Error('Failed to fetch disputes');
  return res.json();
}

export async function fetchDispute(disputeId) {
  const res = await fetch(`${API_BASE}/dispute/${disputeId}`);
  if (!res.ok) throw new Error(`Failed to fetch dispute ${disputeId}`);
  return res.json();
}

export async function fileDispute(payload) {
  const res = await fetch(`${API_BASE}/dispute/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to file dispute');
  }
  return res.json();
}

export async function updateDispute(payload) {
  const res = await fetch(`${API_BASE}/dispute/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update dispute');
  }
  return res.json();
}

export async function seedDispute(passportId, filedBy = 'Arjun') {
  const res = await fetch(`${API_BASE}/demo/seed-dispute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passport_id: passportId,
      filed_by: filedBy,
      reason: 'AMOUNT_MISMATCH',
      description: 'I was charged ₹250 but the agreed amount was ₹200 — please review the conversation evidence.',
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to seed dispute');
  }
  return res.json();
}

export async function resetDemo() {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset');
  return res.json();
}
