const API_BASE = '/api';

export async function fetchMessages() {
  const res = await fetch(`${API_BASE}/chat/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(sender, text) {
  const res = await fetch(`${API_BASE}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, text }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function handleConsentAction(transactionId, user, action) {
  const res = await fetch(`${API_BASE}/consent/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId, user, action }),
  });
  if (!res.ok) throw new Error('Failed to update consent');
  return res.json();
}

export async function resetChat() {
  const res = await fetch(`${API_BASE}/chat/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset chat');
  return res.json();
}

export async function seedDemoScript() {
  const res = await fetch(`${API_BASE}/chat/seed-demo`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo script');
  return res.json();
}

export async function fetchRejectedLogs() {
  const res = await fetch(`${API_BASE}/detections/rejected`);
  if (!res.ok) throw new Error('Failed to fetch rejected logs');
  return res.json();
}

export async function fetchPassportReceipts() {
  const res = await fetch(`${API_BASE}/passport/receipts`);
  if (!res.ok) throw new Error('Failed to fetch passport receipts');
  return res.json();
}
