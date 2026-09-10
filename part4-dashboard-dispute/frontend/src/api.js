const BASE_URL = 'http://localhost:8003/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Part 4 Health check failed');
  return res.json();
}

export async function fetchMerchantDashboard() {
  const res = await fetch(`${BASE_URL}/merchant/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch merchant dashboard');
  return res.json();
}

export async function syncMerchantStatus(passportId, status, paymentRef = null) {
  const res = await fetch(`${BASE_URL}/merchant/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passport_id: passportId,
      status: status,
      payment_reference: paymentRef,
      update_reason: 'Dashboard manual / webhook synchronization',
    }),
  });
  if (!res.ok) throw new Error('Failed to sync merchant record');
  return res.json();
}

export async function fileDispute(passportId, initiator, claimText, defenseText) {
  const res = await fetch(`${BASE_URL}/dispute/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passport_id: passportId,
      initiator: initiator,
      claim_text: claimText,
      defense_text: defenseText,
    }),
  });
  if (!res.ok) throw new Error('Failed to file dispute');
  return res.json();
}

export async function reviewDispute(disputeId) {
  const res = await fetch(`${BASE_URL}/dispute/${disputeId}/review`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to review dispute');
  return res.json();
}

export async function resolveDispute(disputeId, notes) {
  const res = await fetch(`${BASE_URL}/dispute/${disputeId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution_action: 'RESOLVE', resolution_notes: notes }),
  });
  if (!res.ok) throw new Error('Failed to resolve dispute');
  return res.json();
}

export async function fetchEvidence(passportId) {
  const res = await fetch(`${BASE_URL}/dispute/${passportId}/evidence`);
  if (!res.ok) throw new Error(`Failed to fetch evidence for ${passportId}`);
  return res.json();
}

export async function fetchDisputes() {
  const res = await fetch(`${BASE_URL}/disputes`);
  if (!res.ok) throw new Error('Failed to list disputes');
  return res.json();
}

export async function seedDemo() {
  const res = await fetch(`${BASE_URL}/demo/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo');
  return res.json();
}

export async function resetDemo() {
  const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo');
  return res.json();
}
