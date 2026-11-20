import React, { useState } from 'react';
import { usePosStore } from '../store/pos-store';
import { formatCurrency, calculateChange } from '@oshxona/shared';
import { X, Check, DollarSign, CreditCard, Smartphone, BookOpen } from 'lucide-react';

export function PaymentModal() {
  const { isPaymentModalOpen, setPaymentModalOpen, getTotal, clearCart } = usePosStore();
  const total = getTotal();

  const [paidInput, setPaidInput] = useState<string>(total.toString());
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'CLICK' | 'PAYME' | 'DEBT'>('CASH');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isPaymentModalOpen) return null;

  const paidAmount = parseInt(paidInput || '0', 10);
  const change = calculateChange(paidAmount, total);

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setPaidInput('0');
    } else if (val === '⌫') {
      setPaidInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else {
      setPaidInput((prev) => (prev === '0' ? val : prev + val));
    }
  };

  const handleQuickAmount = (amt: number) => {
    setPaidInput(amt.toString());
  };

  const handleConfirmPayment = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      clearCart();
      setPaymentModalOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">To'lov Qabul Qilish</h2>
            <p className="text-xs text-slate-400 mt-0.5">To'lov usulini tanlang va summani tasdiqlang</p>
          </div>
          <button
            onClick={() => setPaymentModalOpen(false)}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <Check className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-white">To'lov Muvaffaqiyatli!</h3>
            <p className="text-sm text-slate-400">Chek printerga yuborildi • Qaytim: {formatCurrency(change)}</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chap tomonda: To'lov usullari va umumiy hisob */}
            <div className="space-y-4">
              {/* Jami to'lov summasi */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TO'LOVGA JAMI:</span>
                <p className="text-3xl font-black text-orange-400 mt-1">{formatCurrency(total)}</p>
              </div>

              {/* To'lov usullari tugmalari */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'CASH', label: 'Naqd Pul', icon: DollarSign, color: 'hover:border-emerald-500' },
                  { id: 'CARD', label: 'Plastik Karta', icon: CreditCard, color: 'hover:border-blue-500' },
                  { id: 'CLICK', label: 'Click / Payme', icon: Smartphone, color: 'hover:border-purple-500' },
                  { id: 'DEBT', label: 'Nasiya (Qarz)', icon: BookOpen, color: 'hover:border-amber-500' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id as any)}
                      className={`min-h-[56px] p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition-all active:scale-95 ${
                        isSel
                          ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/30'
                          : `bg-slate-800/80 border-slate-700 text-slate-300 ${m.color}`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Tez summalar */}
              {method === 'CASH' && (
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 200000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors"
                    >
                      {formatCurrency(amt, false)}
                    </button>
                  ))}
                </div>
              )}

              {/* Qaytim katta shriftda */}
              {method === 'CASH' && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase">QAYTIM:</span>
                    <p className="text-2xl font-black text-emerald-300 mt-0.5">{formatCurrency(change)}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">Berildi: {formatCurrency(paidAmount, false)}</span>
                </div>
              )}
            </div>

            {/* O'ng tomonda: Sensorli Numpad */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-right">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Mijoz Bergan Summa:</span>
                <p className="text-2xl font-mono font-bold text-white mt-0.5">{formatCurrency(paidAmount, false)}</p>
              </div>

              {/* 3x4 Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '00'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleNumpad(btn)}
                    className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xl border border-slate-700/80 transition-all flex items-center justify-center"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              {/* Tasdiqlash tugmasi */}
              <button
                onClick={handleConfirmPayment}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all active:scale-95 mt-2"
              >
                <Check className="w-5 h-5" />
                TO'LOVNI YAKUNLASH VA CHEK CHIQARISH
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
