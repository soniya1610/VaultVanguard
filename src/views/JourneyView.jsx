import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  UserCheck,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  LayoutDashboard,
  Scale,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { trustbridgeEngine } from '../services/trustbridgeEngine.js';

export default function JourneyView({ onNavigatePart }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [engineState, setEngineState] = useState(trustbridgeEngine.state);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const unsub = trustbridgeEngine.subscribe((st) => setEngineState(st));
    return () => unsub();
  }, []);

  const latestTx = engineState.transactions[engineState.transactions.length - 1];
  const latestPassport = engineState.passports[engineState.passports.length - 1];
  const latestPayment = Object.values(engineState.payments)[0];
  const latestMerchant = latestPassport ? engineState.merchants[latestPassport.passport_id] : null;
  const latestDispute = engineState.disputes[0];

  const steps = [
    {
      step: 1,
      title: 'Casual Chat Between Arjun & Riya',
      subtitle: 'Natural language communication without opening payment forms',
      icon: MessageSquare,
      color: 'indigo',
      partKey: 'part1',
      description:
        'Riya mentions: "You still owe me ₹250 for the tea yesterday." Arjun naturally replies: "Yes, I’ll pay you back ₹250 for the tea." TrustBridge listens in real-time.',
      actionText: 'Next: Analyze NLP Intent →',
      action: async () => {
        await trustbridgeEngine.seedDefaultState();
        setCurrentStep(2);
      },
    },
    {
      step: 2,
      title: 'NLP Intent Extraction & Inline Obligation Card',
      subtitle: 'AI interpretation with contextual confidence',
      icon: Sparkles,
      color: 'purple',
      partKey: 'part1',
      description:
        'The NLP engine extracts: Payer = Arjun, Receiver = Riya, Amount = ₹250, Purpose = tea repayment with 94% confidence. An inline card appears directly inside the conversation.',
      actionText: 'Next: Two-Party Consent →',
      action: async () => {
        setCurrentStep(3);
      },
    },
    {
      step: 3,
      title: 'Two-Party Mutual Consent',
      subtitle: 'AI alone cannot establish a financial transaction',
      icon: UserCheck,
      color: 'emerald',
      partKey: 'part1',
      description:
        'Both participants must explicitly confirm the obligation. Arjun confirms he agrees to pay ₹250, and Riya confirms she expects ₹250.',
      actionText: 'Confirm as Arjun & Riya →',
      action: async () => {
        setExecuting(true);
        if (latestTx) {
          await trustbridgeEngine.handleConsentAction(latestTx.transaction_id, 'Arjun', 'confirm');
          await trustbridgeEngine.handleConsentAction(latestTx.transaction_id, 'Riya', 'confirm');
        }
        setExecuting(false);
        setCurrentStep(4);
      },
    },
    {
      step: 4,
      title: 'Transaction Passport Minting',
      subtitle: 'Permanent identity with SHA-256 cryptographic evidence digest',
      icon: ShieldCheck,
      color: 'blue',
      partKey: 'part2',
      description:
        `TrustBridge mints official passport ${latestPassport?.passport_id || 'TP-2026-8F42X91'} with SHA-256 evidence integrity (${latestPassport?.evidence_hash?.substring(0, 16) || 'a8f9c1...'}...) and generates an NPCI UPI deep link.`,
      actionText: 'Next: Initiate UPI Payment →',
      action: async () => {
        setCurrentStep(5);
      },
    },
    {
      step: 5,
      title: 'UPI Payment Initiation',
      subtitle: 'Intent vs Initiation vs Success vs Settlement separation',
      icon: CreditCard,
      color: 'amber',
      partKey: 'part3',
      description:
        'Arjun taps "Pay Now". TrustBridge connects to the Mock UPI Gateway, initiating transaction with payment reference.',
      actionText: 'Execute Payment & Trigger Contradiction →',
      action: async () => {
        setExecuting(true);
        if (latestPassport) {
          await trustbridgeEngine.initiatePayment(latestPassport.passport_id);
        }
        setExecuting(false);
        setCurrentStep(6);
      },
    },
    {
      step: 6,
      title: 'Deliberate Contradiction: Gateway SUCCESS vs Merchant PENDING',
      subtitle: 'The core distributed systems synchronization challenge',
      icon: AlertTriangle,
      color: 'rose',
      partKey: 'part3',
      description:
        'Gateway reports SUCCESS ₹250, but Riya’s Merchant Dashboard intentionally lags at PENDING ₹250! The audience sees the live contradiction that causes payment disputes.',
      actionText: 'Run 6-Point Reconciliation Engine →',
      action: async () => {
        setCurrentStep(7);
      },
    },
    {
      step: 7,
      title: 'Reconciliation Engine Execution',
      subtitle: 'Independent 6-point cross-verification against authoritative gateway',
      icon: RefreshCw,
      color: 'yellow',
      partKey: 'part3',
      description:
        'TrustBridge independently verifies: (1) Passport ID, (2) Payment Reference, (3) Payer Identity, (4) Receiver Identity, (5) Amount & Currency, (6) Authoritative Gateway SUCCESS.',
      actionText: 'Verify & Settle Idempotently →',
      action: async () => {
        setExecuting(true);
        if (latestPassport && latestPassport.payment_reference) {
          await trustbridgeEngine.reconcilePayment(latestPassport.passport_id, latestPassport.payment_reference);
        }
        setExecuting(false);
        setCurrentStep(8);
      },
    },
    {
      step: 8,
      title: 'State Correction & Idempotent Exactly-Once Settlement',
      subtitle: 'Duplicate callbacks and retries are safely rejected',
      icon: CheckCircle2,
      color: 'emerald',
      partKey: 'part3',
      description:
        'State transitions to VERIFIED → SETTLED. An atomic idempotency key is recorded. Even if the gateway retries 10 times, duplicate settlements are strictly rejected.',
      actionText: 'Inspect Live Merchant Dashboard Sync →',
      action: async () => {
        setCurrentStep(9);
      },
    },
    {
      step: 9,
      title: 'Merchant Dashboard Live Sync',
      subtitle: 'Riya’s dashboard updates from PENDING to SETTLED',
      icon: LayoutDashboard,
      color: 'teal',
      partKey: 'part4',
      description:
        'Riya’s Merchant Dashboard now shows ₹250 SETTLED in real-time. The visible contradiction has been completely eliminated by the autonomous reconciliation layer.',
      actionText: 'Simulate Later "He Said / She Said" Dispute →',
      action: async () => {
        setExecuting(true);
        if (latestPassport) {
          await trustbridgeEngine.fileDispute(
            latestPassport.passport_id,
            'Riya',
            'I never received that ₹250 for tea yesterday',
            'I already paid via UPI, check the ledger'
          );
        }
        setExecuting(false);
        setCurrentStep(10);
      },
    },
    {
      step: 10,
      title: 'Verifiable Evidence Dossier & Dispute Resolution',
      subtitle: 'Solving "He Said / She Said" with immutable cryptographic proof',
      icon: Scale,
      color: 'rose',
      partKey: 'part4',
      description:
        'Instead of manual screenshots or bank arguments, TrustBridge produces the complete structured evidence dossier: original chat agreement, mutual confirmations, gateway receipt, contradiction record, and reconciliation proof.',
      actionText: 'Resolve Dispute Conclusively →',
      action: async () => {
        setExecuting(true);
        if (latestDispute) {
          await trustbridgeEngine.resolveDispute(
            latestDispute.dispute_id,
            'Conclusively verified: Gateway SUCCESS receipt and 6-point reconciliation ledger confirmed.'
          );
        }
        setExecuting(false);
      },
    },
  ];

  const currentStepData = steps[currentStep - 1];
  const StepIcon = currentStepData.icon;

  return (
    <div className="flex flex-col space-y-6 max-w-5xl mx-auto py-2">
      {/* Story Mode Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-indigo-400">
              Interactive Story Journey · content.md
            </span>
            <h2 className="text-xl font-extrabold text-slate-100 mt-1">
              The End-to-End TrustBridge Transaction Journey
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Follow Arjun and Riya’s ₹250 tea repayment through all 10 milestones: casual conversation, NLP detection, two-party consent, passport minting, payment contradiction, 6-point reconciliation, idempotent settlement, and dispute proof.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                trustbridgeEngine.seedDefaultState();
                setCurrentStep(1);
              }}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Journey to Step 1</span>
            </button>
          </div>
        </div>

        {/* Stepper Dots / Progress */}
        <div className="mt-6 flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {steps.map((s) => {
            const isDone = s.step < currentStep;
            const isCurrent = s.step === currentStep;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : isDone
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                }`}
              >
                <span>{s.step}.</span>
                <span>{s.title.split(' ')[0]}</span>
                {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Showcase Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Milestone {currentStepData.step} of 10
              </span>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">
                {currentStepData.title}
              </h3>
              <p className="text-xs text-indigo-300 font-medium">
                {currentStepData.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigatePart && onNavigatePart(currentStepData.partKey)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Inspect in {currentStepData.partKey.toUpperCase()}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Narrative Description */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 text-sm leading-relaxed text-slate-300">
          {currentStepData.description}
        </div>

        {/* Live State Snapshot for this step */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Chat & Consent</span>
            <p className="font-semibold text-slate-200">
              {latestTx ? `${latestTx.status} (${latestTx.payer} → ${latestTx.receiver})` : 'No active chat tx'}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Passport Identity</span>
            <p className="font-semibold text-slate-200 font-mono">
              {latestPassport ? `${latestPassport.passport_id} [${latestPassport.state}]` : 'Awaiting Minting'}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Gateway vs Merchant</span>
            <p className="font-semibold text-slate-200">
              {latestPayment
                ? `GW: ${latestPayment.status} | Merchant: ${latestMerchant?.status || 'PENDING'}`
                : 'Payment not yet initiated'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Milestone</span>
          </button>

          <button
            onClick={currentStepData.action}
            disabled={executing}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-950/60 flex items-center space-x-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4" />
            <span>{executing ? 'Executing...' : currentStepData.actionText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
