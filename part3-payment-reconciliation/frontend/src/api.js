import { trustbridgeEngine } from '../../../src/services/trustbridgeEngine.js';

const API_BASE = '/api';

// ── Health ───────────────────────────────────────────────────────
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    status: 'online',
    layer: 'Part 3 — Payment Orchestration & Reconciliation Engine',
    port: 8001,
    passports: trustbridgeEngine.state.passports.length,
    payments: Object.keys(trustbridgeEngine.state.payments).length,
    settlements: trustbridgeEngine.state.settlements.length,
    audit_events: Object.values(trustbridgeEngine.state.auditLogs).flat().length,
  };
}

// ── Passport ─────────────────────────────────────────────────────
export async function fetchPassport(passportId) {
  try {
    const res = await fetch(`${API_BASE}/passport/${passportId}`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  const passport = trustbridgeEngine.getPassport(passportId);
  return { passport };
}

export async function fetchAllPassports() {
  try {
    const res = await fetch(`${API_BASE}/passports`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  const passports = trustbridgeEngine.getPassports().map(p => {
    const payment = Object.values(trustbridgeEngine.state.payments).find(py => py.passport_id === p.passport_id) || null;
    const merchant = trustbridgeEngine.state.merchants[p.passport_id] || null;
    return { passport: p, payment, merchant };
  });
  return { passports };
}

export async function importPassport(payload) {
  try {
    const res = await fetch(`${API_BASE}/passport/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: 'IMPORTED', passport_id: payload.passport_id };
}

// ── Payment ──────────────────────────────────────────────────────
export async function initiatePayment(passportId) {
  try {
    const res = await fetch(`${API_BASE}/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport_id: passportId }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.initiatePayment(passportId);
}

export async function triggerGatewayCallback(passportId, paymentReference) {
  try {
    const res = await fetch(`${API_BASE}/payment/gateway-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport_id: passportId, payment_reference: paymentReference }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.triggerGatewayCallback(passportId, paymentReference);
}

export async function reconcilePayment(passportId, paymentReference) {
  try {
    const res = await fetch(`${API_BASE}/payment/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport_id: passportId, payment_reference: paymentReference }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.reconcilePayment(passportId, paymentReference);
}

export async function fetchPayment(paymentRef) {
  try {
    const res = await fetch(`${API_BASE}/payment/${paymentRef}`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  const payment = trustbridgeEngine.state.payments[paymentRef];
  return { payment };
}

// ── Merchant ─────────────────────────────────────────────────────
export async function fetchMerchant(passportId) {
  try {
    const res = await fetch(`${API_BASE}/merchant/${passportId}`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  const merchant = trustbridgeEngine.state.merchants[passportId];
  return { merchant };
}

// ── Audit ────────────────────────────────────────────────────────
export async function fetchAuditLog(passportId) {
  try {
    const res = await fetch(`${API_BASE}/audit/${passportId}`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { events: trustbridgeEngine.getAuditLog(passportId) };
}

// ── Settlements ──────────────────────────────────────────────────
export async function fetchSettlements() {
  try {
    const res = await fetch(`${API_BASE}/settlements`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.getSettlements();
}

// ── Demo ─────────────────────────────────────────────────────────
export async function seedDemo(payer = 'Arjun', receiver = 'Riya', amount = 250, currency = 'INR', purpose = 'tea') {
  try {
    const res = await fetch(`${API_BASE}/demo/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payer, receiver, amount, currency, purpose }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  await trustbridgeEngine.seedDefaultState();
  return { status: 'SEEDED' };
}

export async function resetDemo() {
  try {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST', signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  trustbridgeEngine.resetAll();
  return { status: 'RESET' };
}
