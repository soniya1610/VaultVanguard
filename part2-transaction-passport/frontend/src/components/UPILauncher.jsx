import React, { useState } from 'react';
import { QrCode, ExternalLink, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import { triggerPart3Payment } from '../api.js';

export default function UPILauncher({ passport, onPaymentTriggered }) {
  const [loading, setLoading] = useState(false);
  const [payStatus, setPayStatus] = useState(null);

  if (!passport) return null;

  const isConfirmed = passport.state === 'CONFIRMED';
  const isSettled = passport.state === 'SETTLED';

  const handlePayNow = async () => {
    setLoading(true);
    setPayStatus(null);
    try {
      const res = await triggerPart3Payment(passport.passport_id);
      setPayStatus({ success: true, message: `Payment Initiated: ${res.payment_reference}` });
      if (onPaymentTriggered) onPaymentTriggered(res);
    } catch (err) {
      setPayStatus({
        success: false,
        message: 'Could not connect to Part 3 (port 8001). Ensure Part 3 backend is running.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(51, 65, 85, 0.6)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard style={{ width: 15, height: 15, color: '#38bdf8' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              UPI Deep Link & Payment Intent
            </h4>
            <p style={{ fontSize: '10px', color: '#64748b' }}>
              Standard NPCI UPI protocol specification generated for Pay Now
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontWeight: 700,
            background: isSettled ? 'rgba(16, 185, 129, 0.2)' : isConfirmed ? 'rgba(99, 102, 241, 0.2)' : 'rgba(251, 146, 60, 0.2)',
            color: isSettled ? '#34d399' : isConfirmed ? '#a5b4fc' : '#fb923c',
          }}
        >
          {passport.state}
        </span>
      </div>

      {/* UPI Deep Link Code */}
      <div
        style={{
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
          Generated URI:
        </span>
        <p
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: '#a5b4fc',
            wordBreak: 'break-all',
          }}
        >
          {passport.upi_deep_link}
        </p>
      </div>

      {/* Pay Now Button */}
      {isConfirmed ? (
        <button
          onClick={handlePayNow}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            color: 'white',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
          }}
        >
          <CreditCard style={{ width: 16, height: 16 }} />
          {loading ? 'Initiating UPI Payment...' : `Pay Now ₹${passport.amount.toFixed(2)} (Connect to Payment Layer)`}
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      ) : isSettled ? (
        <div
          style={{
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <CheckCircle2 style={{ width: 16, height: 16 }} />
          Transaction Successfully Settled — No Pending Payment
        </div>
      ) : (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(51, 65, 85, 0.3)',
            color: '#94a3b8',
            fontSize: '11px',
            textAlign: 'center',
          }}
        >
          Payment in state: <strong>{passport.state}</strong>
        </div>
      )}

      {payStatus && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '11px',
            background: payStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: payStatus.success ? '#34d399' : '#f87171',
          }}
        >
          {payStatus.message}
        </div>
      )}
    </div>
  );
}
