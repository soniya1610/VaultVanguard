import { trustbridgeEngine } from '../../../src/services/trustbridgeEngine.js';

const API_BASE = '/api';

export async function fetchMessages() {
  try {
    const res = await fetch(`${API_BASE}/chat/messages`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback to in-browser engine on GitHub Pages / offline
  }
  return trustbridgeEngine.getChatData();
}

export async function sendMessage(sender, text) {
  try {
    const res = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, text }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.sendChatMessage(sender, text);
}

export async function handleConsentAction(transactionId, user, action) {
  try {
    const res = await fetch(`${API_BASE}/consent/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: transactionId, user, action }),
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return trustbridgeEngine.handleConsentAction(transactionId, user, action);
}

export async function resetChat() {
  try {
    const res = await fetch(`${API_BASE}/chat/reset`, { method: 'POST', signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  trustbridgeEngine.resetAll();
  return { status: 'RESET' };
}

export async function seedDemoScript() {
  try {
    const res = await fetch(`${API_BASE}/chat/seed-demo`, { method: 'POST', signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  await trustbridgeEngine.seedDefaultState();
  return { status: 'SEEDED' };
}

export async function fetchRejectedLogs() {
  try {
    const res = await fetch(`${API_BASE}/detections/rejected`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { rejected: trustbridgeEngine.state.rejectedLogs };
}

export async function fetchPassportReceipts() {
  try {
    const res = await fetch(`${API_BASE}/passport/receipts`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { receipts: trustbridgeEngine.state.passportReceipts };
}
