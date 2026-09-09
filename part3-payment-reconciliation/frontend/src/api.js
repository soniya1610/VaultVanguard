const API_BASE = '/api';

// ── Health ───────────────────────────────────────────────────────
export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend offline');
  return res.json();
}

// ── Passport ─────────────────────────────────────────────────────
export async function fetchPassport(passportId) {
  const res = await fetch(`${API_BASE}/passport/${passportId}`);
  if (!res.ok) throw new Error(`Failed to fetch passport ${passportId}`);
  return res.json();
}

export async function fetchAllPassports() {
  const res = await fetch(`${API_BASE}/passports`);
  if (!res.ok) throw new Error('Failed to fetch passports');
  return res.json();
}

export async function importPassport(payload) {
  const res = await fetch(`${API_BASE}/passport/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to import passport');
  return res.json();
}

// ── Payment ──────────────────────────────────────────────────────
export async function initiatePayment(passportId) {
  const res = await fetch(`${API_BASE}/payment/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passport_id: passportId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to initiate payment');
  }
  return res.json();
}

export async function triggerGatewayCallback(passportId, paymentReference) {
  const res = await fetch(`${API_BASE}/payment/gateway-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passport_id: passportId, payment_reference: paymentReference }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Gateway callback failed');
  }
  return res.json();
}

export async function reconcilePayment(passportId, paymentReference) {
  const res = await fetch(`${API_BASE}/payment/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passport_id: passportId, payment_reference: paymentReference }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Reconciliation failed');
  }
  return res.json();
}

export async function fetchPayment(paymentRef) {
  const res = await fetch(`${API_BASE}/payment/${paymentRef}`);
  if (!res.ok) throw new Error(`Failed to fetch payment ${paymentRef}`);
  return res.json();
}

// ── Merchant ─────────────────────────────────────────────────────
export async function fetchMerchant(passportId) {
  const res = await fetch(`${API_BASE}/merchant/${passportId}`);
  if (!res.ok) throw new Error(`Failed to fetch merchant record for ${passportId}`);
  return res.json();
}

// ── Audit ────────────────────────────────────────────────────────
export async function fetchAuditLog(passportId) {
  const res = await fetch(`${API_BASE}/audit/${passportId}`);
  if (!res.ok) throw new Error(`Failed to fetch audit log for ${passportId}`);
  return res.json();
}

// ── Settlements ──────────────────────────────────────────────────
export async function fetchSettlements() {
  const res = await fetch(`${API_BASE}/settlements`);
  if (!res.ok) throw new Error('Failed to fetch settlements');
  return res.json();
}

// ── Demo ─────────────────────────────────────────────────────────
export async function seedDemo(payer = 'Arjun', receiver = 'Riya', amount = 250, currency = 'INR', purpose = 'tea') {
  const res = await fetch(`${API_BASE}/demo/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payer, receiver, amount, currency, purpose }),
  });
  if (!res.ok) throw new Error('Failed to seed demo');
  return res.json();
}

export async function resetDemo() {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo');
  return res.json();
}
