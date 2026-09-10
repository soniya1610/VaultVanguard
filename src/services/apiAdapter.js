import { trustbridgeEngine } from './trustbridgeEngine.js';

/**
 * Universal API Adapter for TrustBridge (VaultVanguard)
 * 
 * Works seamlessly across GitHub Pages static deployment and local multi-service dev.
 * Provides unified access to all 4 microservice layers with zero console errors.
 */

// Detect if we are running in production / GitHub Pages
export const isProductionHosted = 
  typeof window !== 'undefined' && 
  (window.location.hostname.includes('github.io') || 
   window.location.protocol === 'https:' ||
   !window.location.hostname.includes('localhost'));

// ── Part 1: Conversation, NLP & Mutual Consent ──────────────────────
export const p1Api = {
  async fetchMessages() {
    return trustbridgeEngine.getChatData();
  },
  async sendMessage(sender, text) {
    return trustbridgeEngine.sendChatMessage(sender, text);
  },
  async handleConsentAction(transactionId, user, action) {
    return trustbridgeEngine.handleConsentAction(transactionId, user, action);
  },
  async resetChat() {
    trustbridgeEngine.resetAll();
    return { status: 'RESET' };
  },
  async seedDemoScript() {
    await trustbridgeEngine.seedDefaultState();
    return { status: 'SEEDED' };
  },
  async fetchRejectedLogs() {
    return { rejected: trustbridgeEngine.state.rejectedLogs };
  },
  async fetchPassportReceipts() {
    return { receipts: trustbridgeEngine.state.passportReceipts };
  },
};

// ── Part 2: Transaction Passport & State Machine ───────────────────
export const p2Api = {
  async fetchHealth() {
    return {
      status: 'online',
      layer: 'Part 2 — Transaction Passport & State Machine',
      port: 8002,
      passport_count: trustbridgeEngine.state.passports.length,
    };
  },
  async fetchPassports() {
    return { passports: trustbridgeEngine.getPassports() };
  },
  async fetchPassport(passportId) {
    const passport = trustbridgeEngine.getPassport(passportId);
    if (!passport) throw new Error(`Passport ${passportId} not found`);
    return { passport };
  },
  async fetchTimeline(passportId) {
    return { timeline: trustbridgeEngine.getTimeline(passportId) };
  },
  async verifyIntegrity(passportId) {
    return trustbridgeEngine.verifyPassportIntegrity(passportId);
  },
  async transitionState(passportId, data) {
    const passport = trustbridgeEngine.getPassport(passportId);
    if (!passport) throw new Error('Passport not found');
    passport.state = data.target_state || data.state || passport.state;
    trustbridgeEngine.notify();
    return { status: 'TRANSITIONED', passport };
  },
  async seedDemo() {
    await trustbridgeEngine.seedDefaultState();
    return { status: 'SEEDED' };
  },
  async resetDemo() {
    trustbridgeEngine.resetAll();
    return { status: 'RESET' };
  },
  async triggerPart3Payment(passportId) {
    return trustbridgeEngine.initiatePayment(passportId);
  },
};

// ── Part 3: Payment Orchestration & Reconciliation Engine ───────────
export const p3Api = {
  async fetchHealth() {
    return {
      status: 'online',
      layer: 'Part 3 — Payment Orchestration & Reconciliation Engine',
      port: 8001,
      passports: trustbridgeEngine.state.passports.length,
      payments: Object.keys(trustbridgeEngine.state.payments).length,
      settlements: trustbridgeEngine.state.settlements.length,
      audit_events: Object.values(trustbridgeEngine.state.auditLogs).flat().length,
    };
  },
  async fetchAllPassports() {
    const passports = trustbridgeEngine.getPassports().map(p => {
      const payment = Object.values(trustbridgeEngine.state.payments).find(py => py.passport_id === p.passport_id) || null;
      const merchant = trustbridgeEngine.state.merchants[p.passport_id] || null;
      return { passport: p, payment, merchant };
    });
    return { passports };
  },
  async fetchPassport(passportId) {
    const passport = trustbridgeEngine.getPassport(passportId);
    return { passport };
  },
  async importPassport(payload) {
    return { status: 'IMPORTED', passport_id: payload.passport_id };
  },
  async initiatePayment(passportId) {
    return trustbridgeEngine.initiatePayment(passportId);
  },
  async triggerGatewayCallback(passportId, paymentReference) {
    return trustbridgeEngine.triggerGatewayCallback(passportId, paymentReference);
  },
  async reconcilePayment(passportId, paymentReference) {
    return trustbridgeEngine.reconcilePayment(passportId, paymentReference);
  },
  async fetchPayment(paymentRef) {
    const payment = trustbridgeEngine.state.payments[paymentRef];
    return { payment };
  },
  async fetchMerchant(passportId) {
    const merchant = trustbridgeEngine.state.merchants[passportId];
    return { merchant };
  },
  async fetchAuditLog(passportId) {
    return { events: trustbridgeEngine.getAuditLog(passportId) };
  },
  async fetchSettlements() {
    return trustbridgeEngine.getSettlements();
  },
  async seedDemo() {
    await trustbridgeEngine.seedDefaultState();
    return { status: 'SEEDED' };
  },
  async resetDemo() {
    trustbridgeEngine.resetAll();
    return { status: 'RESET' };
  },
};

// ── Part 4: Merchant Dashboard & Dispute Resolution ────────────────
export const p4Api = {
  async fetchHealth() {
    return {
      status: 'online',
      layer: 'Part 4 — Merchant Dashboard & Dispute Resolution',
      port: 8003,
      transactions_count: Object.keys(trustbridgeEngine.state.merchants).length,
      disputes_count: trustbridgeEngine.state.disputes.length,
    };
  },
  async fetchMerchantDashboard() {
    return trustbridgeEngine.getMerchantDashboard();
  },
  async syncMerchantStatus(passportId, status, paymentRef = null) {
    return trustbridgeEngine.syncMerchantStatus(passportId, status);
  },
  async fileDispute(passportId, initiator, claimText, defenseText) {
    return trustbridgeEngine.fileDispute(passportId, initiator, claimText, defenseText);
  },
  async reviewDispute(disputeId) {
    return trustbridgeEngine.reviewDispute(disputeId);
  },
  async resolveDispute(disputeId, notes) {
    return trustbridgeEngine.resolveDispute(disputeId, notes);
  },
  async fetchEvidence(passportId) {
    return trustbridgeEngine.buildEvidenceDossier(passportId);
  },
  async fetchDisputes() {
    return { disputes: trustbridgeEngine.getDisputes() };
  },
  async seedDemo() {
    await trustbridgeEngine.seedDefaultState();
    return { status: 'SEEDED' };
  },
  async resetDemo() {
    trustbridgeEngine.resetAll();
    return { status: 'RESET' };
  },
};
