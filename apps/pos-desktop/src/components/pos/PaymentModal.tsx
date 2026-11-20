import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Banknote,
  CreditCard,
  QrCode,
  Layers,
  Delete,
  WifiOff,
} from 'lucide-react';
import { formatCurrency, calculateChange } from '@oshxona/shared';
import { usePosStore } from '../../store/pos-store';
import type { PaymentMethod } from '../../data/catalog';

export function PaymentModal() {
  const {
    isPaymentModalOpen,
    setPaymentModalOpen,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    getTotal,
    completePayment,
    syncStatus,
    settings,
  } = usePosStore();

  const total = getTotal();
  const [paidInput, setPaidInput] = useState<string>(String(total));
  const [mixedCash, setMixedCash] = useState<string>(String(Math.round(total / 2)));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isPaymentModalOpen) {
      setPaidInput(String(total));
      setMixedCash(String(Math.round(total / 2)));
    }
  }, [isPaymentModalOpen, total]);

  if (!isPaymentModalOpen) return null;

  const paidAmount = parseInt(paidInput || '0', 10);
  const change = calculateChange(paidAmount, total);
  const cashPart = Math.min(total, Math.max(0, parseInt(mixedCash || '0', 10)));
  const cardPart = Math.max(0, total - cashPart);

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setPaidInput('0');
    } else if (val === 'BS') {
      setPaidInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else {
      setPaidInput((prev) => (prev === '0' ? val : prev + val));
    }
  };

  const handleConfirm = async () => {
    if (selectedPaymentMethod === 'CASH' && paidAmount < total) {
      return;
    }
    setIsSubmitting(true);
    await completePayment({
      method: selectedPaymentMethod,
      paidAmount: selectedPaymentMethod === 'CASH' ? paidAmount : total,
      mixedCashAmount: selectedPaymentMethod === 'MIXED' ? cashPart : undefined,
      mixedCardAmount: selectedPaymentMethod === 'MIXED' ? cardPart : undefined,
    });
    setIsSubmitting(false);
  };

  const methods: { id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'CASH', label: 'Naqd pul', icon: Banknote },
    { id: 'QR', label: 'QR to\'lov', icon: QrCode },
    { id: 'CARD', label: 'Bank kartasi', icon: CreditCard },
    { id: 'MIXED', label: 'Aralash', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">To'lovni tasdiqlash</h2>
            <p className="text-xs text-slate-500 mt-0.5">To'lov turini tanlang va summani tekshiring</p>
          </div>
          <button
            onClick={() => setPaymentModalOpen(false)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline warning for digital payments */}
        {syncStatus === 'OFFLINE' && (selectedPaymentMethod === 'QR' || selectedPaymentMethod === 'CARD') && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-800">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Hozir <strong>Offline rejim</strong>. To'lov lokal saqlanadi va «Sinxron kutilmoqda» holatida turadi (server tasdig'isiz yakunlangan deb belgilanmaydi).
            </span>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Total + Payment Methods + Details */}
          <div className="space-y-4">
            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl">
              <span className="text-[11px] font-bold text-[#0F9D8A] uppercase tracking-wider">
                To'lovga jami
              </span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{formatCurrency(total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = selectedPaymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedPaymentMethod(m.id)}
                    className={`h-12 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      active
                        ? 'bg-[#0F9D8A] border-[#0F9D8A] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-[#0F9D8A]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {selectedPaymentMethod === 'CASH' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000].map(
                    (amt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPaidInput(String(amt))}
                        className="py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                      >
                        {formatCurrency(amt, false)}
                      </button>
                    ),
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">Qaytim</span>
                    <p className="text-xl font-extrabold text-emerald-800">{formatCurrency(change)}</p>
                  </div>
                  {paidAmount < total && (
                    <span className="text-xs font-semibold text-rose-600">
                      Yetmaydi: {formatCurrency(total - paidAmount)}
                    </span>
                  )}
                </div>
              </>
            )}

            {selectedPaymentMethod === 'QR' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0F9D8A] shrink-0">
                  <QrCode className="w-10 h-10" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-800">{settings.qrProviderLabel}</p>
                  <p className="text-slate-500 mt-0.5">
                    Mijoz QR kodni skanerlagandan so'ng to'lovni tasdiqlang.
                  </p>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'MIXED' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Naqd pul qismi (so'm)</label>
                  <input
                    type="number"
                    value={mixedCash}
                    onChange={(e) => setMixedCash(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Bank kartasi qismi:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(cardPart)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Touch Numpad + Confirm Button */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-right mb-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  Qabul qilingan summa
                </span>
                <p className="text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(selectedPaymentMethod === 'CASH' ? paidAmount : total, false)} so'm
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BS'].map((btn) => (
                  <button
                    key={btn}
                    disabled={selectedPaymentMethod !== 'CASH'}
                    onClick={() => handleNumpad(btn)}
                    className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 active:scale-95 text-slate-800 font-bold text-lg transition-all flex items-center justify-center"
                  >
                    {btn === 'BS' ? <Delete className="w-5 h-5" /> : btn}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={isSubmitting || (selectedPaymentMethod === 'CASH' && paidAmount < total)}
              onClick={handleConfirm}
              className="w-full h-12 bg-[#0F9D8A] hover:bg-[#0D8A79] disabled:opacity-45 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-5 h-5" />
              To'lovni tasdiqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
