import { trustbridgeEngine } from '../../../src/services/trustbridgeEngine.js';

const BASE_URL = 'http://localhost:8002/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return {
    status: 'online',
    layer: 'Part 2 — Transaction Passport & State Machine',
    port: 8002,
    passport_count: trustbridgeEngine.state.passports.length,
  };
}

export async function fetchPassports() {
  try {
    const res = await fetch(`${BASE_URL}/passports`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { passports: trustbridgeEngine.getPassports() };
}

export async function fetchPassport(passportId) {
  try {
    const res = await fetch(`${BASE_URL}/passport/${passportId}`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  const passport = trustbridgeEngine.getPassport(passportId);
  if (!passport) throw new Error(`Failed to fetch passport ${passportId}`);
  return { passport };
}

export async function fetchTimeline(passportId) {
  try {
    const res = await fetch(`${BASE_URL}/passport/${passportId}/timeline`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { timeline: trustbridgeEngine.getTimeline(passportId) };
}

export async function verifyIntegrity(passportId) {
  try {
    const res = await fetch(`${BASE_URL}/passport/${passportId}/verify`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.verifyPassportIntegrity(passportId);
}

export async function transitionState(passportId, data) {
  try {
    const res = await fetch(`${BASE_URL}/passport/${passportId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  const passport = trustbridgeEngine.getPassport(passportId);
  if (!passport) throw new Error('Failed to transition state');
  passport.state = data.target_state || data.state || passport.state;
  trustbridgeEngine.notify();
  return { status: 'TRANSITIONED', passport };
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

// Payment trigger helper to Part 3 (if active)
export async function triggerPart3Payment(passportId) {
  try {
    const res = await fetch('http://localhost:8001/api/payment/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport_id: passportId }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.initiatePayment(passportId);
}
