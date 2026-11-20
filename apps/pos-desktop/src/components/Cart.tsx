import React from 'react';
import { usePosStore } from '../store/pos-store';
import { formatCurrency } from '@oshxona/shared';
import { Plus, Minus, Trash2, Send, CreditCard } from 'lucide-react';

export function Cart() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getServiceFee,
    getTotal,
    serviceFeePercent,
    setPaymentModalOpen,
  } = usePosStore();

  const subtotal = getSubtotal();
  const serviceFee = getServiceFee();
  const total = getTotal();

  return (
    <div className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col justify-between">
      {/* Savat sarlavhasi */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-white">Joriy Savat</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-600/30 text-orange-400 border border-orange-500/30">
            {cart.length} xil
          </span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Taomlar ro'yxati */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
            <p className="text-sm font-semibold">Savat bo'sh</p>
            <p className="text-xs mt-1">Chapdagi menyudan taomlarni tanlang</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                <p className="text-xs font-semibold text-orange-400 mt-0.5">
                  {formatCurrency(item.unitPrice, false)}
                </p>
              </div>

              {/* Soni boshqaruvi */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(idx, -1)}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm w-5 text-center text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(idx, 1)}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white active:scale-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hisob-kitob va TO'LOV tugmasi */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Taomlar:</span>
            <span className="text-slate-200 font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between">
              <span>Xizmat ({serviceFeePercent}%):</span>
              <span className="text-slate-200 font-semibold">{formatCurrency(serviceFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
            <span>JAMI:</span>
            <span className="text-orange-400">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* 2 ta katta harakat tugmasi */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            disabled={cart.length === 0}
            className="h-12 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-95"
          >
            <Send className="w-4 h-4 text-orange-400" />
            Oshxona (F4)
          </button>

          <button
            disabled={cart.length === 0}
            onClick={() => setPaymentModalOpen(true)}
            className="h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            TO'LOV (F5)
          </button>
        </div>
      </div>
    </div>
  );
}
