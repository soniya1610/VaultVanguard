const BASE_URL = 'http://localhost:8002/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Part 2 Health check failed');
  return res.json();
}

export async function fetchPassports() {
  const res = await fetch(`${BASE_URL}/passports`);
  if (!res.ok) throw new Error('Failed to fetch passports');
  return res.json();
}

export async function fetchPassport(passportId) {
  const res = await fetch(`${BASE_URL}/passport/${passportId}`);
  if (!res.ok) throw new Error(`Failed to fetch passport ${passportId}`);
  return res.json();
}

export async function fetchTimeline(passportId) {
  const res = await fetch(`${BASE_URL}/passport/${passportId}/timeline`);
  if (!res.ok) throw new Error(`Failed to fetch timeline for ${passportId}`);
  return res.json();
}

export async function verifyIntegrity(passportId) {
  const res = await fetch(`${BASE_URL}/passport/${passportId}/verify`);
  if (!res.ok) throw new Error(`Failed to verify passport ${passportId}`);
  return res.json();
}

export async function transitionState(passportId, data) {
  const res = await fetch(`${BASE_URL}/passport/${passportId}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Transition error' }));
    throw new Error(err.detail || 'Failed to transition state');
  }
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

// Payment trigger helper to Part 3 (if active)
export async function triggerPart3Payment(passportId) {
  const res = await fetch('http://localhost:8001/api/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passport_id: passportId }),
  });
  if (!res.ok) throw new Error('Part 3 payment initiation failed');
  return res.json();
}
