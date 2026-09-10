import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Sparkles, Cpu } from 'lucide-react';

export default function DetectionCard({ transaction, activeUser, onConsentAction }) {
  const {
    transaction_id,
    payer,
    receiver,
    amount,
    currency,
    purpose,
    payer_confirmed,
    receiver_confirmed,
    status,
    passport_id,
    detection,
  } = transaction;

  const isPayer = activeUser === payer;
  const isReceiver = activeUser === receiver;
  const userConfirmed = isPayer ? payer_confirmed : isReceiver ? receiver_confirmed : false;

  let headerText = '';
  if (status === 'MUTUAL_CONSENT_REACHED') {
    headerText = 'Mutual Consent Established ✅';
  } else if (status === 'DISMISSED') {
    headerText = 'Transaction Dismissed';
  } else {
    if (isPayer) {
      headerText = payer_confirmed
        ? `You confirmed. Waiting for ${receiver}'s confirmation...`
        : `Detected: You owe ${receiver} ${currency === 'INR' ? '₹' : currency}${amount}${purpose && purpose !== 'Unspecified' ? ` for ${purpose}` : ''} — Confirm?`;
    } else if (isReceiver) {
      headerText = receiver_confirmed
        ? `You confirmed. Waiting for ${payer}'s confirmation...`
        : payer_confirmed
        ? `${payer} confirmed they owe you ${currency === 'INR' ? '₹' : currency}${amount}${purpose && purpose !== 'Unspecified' ? ` for ${purpose}` : ''} — Confirm?`
        : `Detected: ${payer} owes you ${currency === 'INR' ? '₹' : currency}${amount}${purpose && purpose !== 'Unspecified' ? ` for ${purpose}` : ''} — Confirm?`;
    } else {
      headerText = `Detected: ${payer} owes ${receiver} ${currency === 'INR' ? '₹' : currency}${amount}${purpose && purpose !== 'Unspecified' ? ` for ${purpose}` : ''}`;
    }
  }

  return (
    <div
      className={`my-3 p-4 rounded-xl border transition-all duration-300 shadow-md ${
        status === 'MUTUAL_CONSENT_REACHED'
          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100 shadow-emerald-900/20'
          : status === 'DISMISSED'
          ? 'bg-slate-800/40 border-slate-700/60 text-slate-400 opacity-75'
          : 'bg-indigo-950/40 border-indigo-500/60 text-slate-100 shadow-indigo-950/40'
      }`}
    >
      <div className="flex items-center justify-between mb-3 border-b border-slate-700/40 pb-2.5">
        <div className="flex items-center space-x-2">
          {status === 'MUTUAL_CONSENT_REACHED' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse-subtle" />
          )}
          <span className="font-semibold text-xs tracking-wide uppercase text-indigo-300">
            TrustBridge Financial Intent Engine
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {detection?.used_fallback ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
              title="Rule-based heuristic fallback active"
            >
              <Cpu className="w-3 h-3 mr-1" />
              (basic detection mode)
            </span>
          ) : (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
              title="LLM Structured Extraction"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              LLM Mode ({(detection?.confidence * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-base text-slate-100 leading-snug">{headerText}</p>

        <div className="flex items-center text-xs text-slate-300 space-x-4 pt-1">
          <div>
            <span className="text-slate-400">Payer:</span>{' '}
            <span className="font-medium text-indigo-300">{payer}</span>
          </div>
          <div>
            <span className="text-slate-400">Receiver:</span>{' '}
            <span className="font-medium text-emerald-300">{receiver}</span>
          </div>
          <div>
            <span className="text-slate-400">Amount:</span>{' '}
            <span className="font-bold text-amber-300">
              {currency === 'INR' ? '₹' : currency}
              {amount}
            </span>
          </div>
          {purpose && purpose !== 'Unspecified' && (
            <div>
              <span className="text-slate-400">Purpose:</span>{' '}
              <span className="font-medium text-slate-200 capitalize">{purpose}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-xs">
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
            payer_confirmed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {payer_confirmed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border border-slate-500 shrink-0" />
          )}
          <span>{payer} (Payer): {payer_confirmed ? 'Confirmed ✓' : 'Pending'}</span>
        </div>

        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
            receiver_confirmed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
          }`}
        >
          {receiver_confirmed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border border-slate-500 shrink-0" />
          )}
          <span>{receiver} (Receiver): {receiver_confirmed ? 'Confirmed ✓' : 'Pending'}</span>
        </div>
      </div>

      {status === 'MUTUAL_CONSENT_REACHED' && (
        <div className="mt-3.5 space-y-2.5">
          <div className="p-3 rounded-lg bg-emerald-900/50 border border-emerald-500/40 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Both parties confirmed ✅ <span className="text-slate-300">Transaction Passport Minted</span>
              </span>
            </div>
            {passport_id && (
              <span className="font-mono bg-emerald-950 px-2.5 py-1 rounded text-emerald-300 border border-emerald-500/40 font-semibold tracking-wide">
                {passport_id}
              </span>
            )}
          </div>

          {/* Pay Now Button (Presented to Arjun per content.md) */}
          <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div>
              <div className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                <span>Payment Request Generated (UPI)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click Pay Now to connect to Payment Layer (Part 3) and execute UPI transfer.
              </p>
            </div>

            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98] transition-all no-underline"
            >
              <span>⚡ Pay Now {currency === 'INR' ? '₹' : currency}{amount}</span>
            </a>
          </div>

          {/* Cross-Service Deep Links */}
          <div className="flex items-center justify-end space-x-3 text-[11px] pt-1">
            <a
              href="#/part2"
              onClick={(e) => {
                if (window.location.hash !== undefined) {
                  window.location.hash = '#/part2';
                }
              }}
              className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              Inspect Passport Timeline (Part 2) ↗
            </a>
            <span className="text-slate-600">·</span>
            <a
              href="#/part4"
              onClick={(e) => {
                if (window.location.hash !== undefined) {
                  window.location.hash = '#/part4';
                }
              }}
              className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Dispute / View Evidence (Part 4) ↗
            </a>
          </div>
        </div>
      )}

      {status === 'PENDING' && (
        <div className="mt-3.5 flex items-center space-x-3">
          <button
            disabled={userConfirmed}
            onClick={() => onConsentAction(transaction_id, activeUser, 'confirm')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium text-xs transition-all shadow ${
              userConfirmed
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 cursor-pointer active:scale-[0.98]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{userConfirmed ? 'You Confirmed ✓' : `Confirm as ${activeUser}`}</span>
          </button>

          <button
            onClick={() => onConsentAction(transaction_id, activeUser, 'dismiss')}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer active:scale-[0.98] transition-all"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
}
