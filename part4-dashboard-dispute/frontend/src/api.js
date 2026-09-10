import { trustbridgeEngine } from '../../../src/services/trustbridgeEngine.js';

const BASE_URL = 'http://localhost:8003/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    status: 'online',
    layer: 'Part 4 — Merchant Dashboard & Dispute Resolution',
    port: 8003,
    transactions_count: Object.keys(trustbridgeEngine.state.merchants).length,
    disputes_count: trustbridgeEngine.state.disputes.length,
  };
}

export async function fetchMerchantDashboard() {
  try {
    const res = await fetch(`${BASE_URL}/merchant/dashboard`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.getMerchantDashboard();
}

export async function syncMerchantStatus(passportId, status, paymentRef = null) {
  try {
    const res = await fetch(`${BASE_URL}/merchant/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passport_id: passportId,
        status: status,
        payment_reference: paymentRef,
        update_reason: 'Dashboard manual / webhook synchronization',
      }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.syncMerchantStatus(passportId, status);
}

export async function fileDispute(passportId, initiator, claimText, defenseText) {
  try {
    const res = await fetch(`${BASE_URL}/dispute/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passport_id: passportId,
        initiator: initiator,
        claim_text: claimText,
        defense_text: defenseText,
      }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.fileDispute(passportId, initiator, claimText, defenseText);
}

export async function reviewDispute(disputeId) {
  try {
    const res = await fetch(`${BASE_URL}/dispute/${disputeId}/review`, { method: 'POST', signal: AbortSignal.timeout(1500) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.reviewDispute(disputeId);
}

export async function resolveDispute(disputeId, notes) {
  try {
    const res = await fetch(`${BASE_URL}/dispute/${disputeId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_action: 'RESOLVE', resolution_notes: notes }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.resolveDispute(disputeId, notes);
}

export async function fetchEvidence(passportId) {
  try {
    const res = await fetch(`${BASE_URL}/dispute/${passportId}/evidence`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      return { evidence_package: data.evidence_package || data };
    }
  } catch (e) {}
  const dossier = await trustbridgeEngine.buildEvidenceDossier(passportId);
  return { evidence_package: dossier };
}

export async function fetchDisputes() {
  try {
    const res = await fetch(`${BASE_URL}/disputes`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { disputes: trustbridgeEngine.getDisputes() };
}

export async function seedDemo() {
  try {
    const res = await fetch(`${BASE_URL}/demo/seed`, { method: 'POST', signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  await trustbridgeEngine.seedDefaultState();
  return { status: 'SEEDED' };
}

export async function resetDemo() {
  try {
    const res = await fetch(`${BASE_URL}/demo/reset`, { method: 'POST', signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  trustbridgeEngine.resetAll();
  return { status: 'RESET' };
}
