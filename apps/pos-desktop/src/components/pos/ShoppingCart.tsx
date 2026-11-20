import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  CreditCard,
  Layers,
  Send,
  Percent,
  Armchair,
} from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../../store/pos-store';

export function ShoppingCart() {
  const {
    cart,
    orderType,
    setOrderType,
    selectedTable,
    setActiveTab,
    updateQuantity,
    removeFromCart,
    clearCart,
    discountPercent,
    discountAmount,
    applyDiscountPercent,
    settings,
    getSubtotal,
    getServiceFee,
    getTaxAmount,
    getTotal,
    openPaymentModal,
    sendCartToKitchen,
    cashier,
  } = usePosStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(discountPercent));

  const subtotal = getSubtotal();
  const serviceFee = getServiceFee();
  const taxAmount = getTaxAmount();
  const total = getTotal();

  const handleApplyDiscount = () => {
    const val = Number(discountInput || 0);
    const res = applyDiscountPercent(val);
    if (res.ok) {
      setShowDiscountInput(false);
    }
  };

  return (
    <section className="h-full bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header: Shopping Cart title + Table/OrderType + Clear button */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-bold text-slate-800">Savat</h2>
          <button
            onClick={() => setActiveTab('tables')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-[#0F9D8A] border border-teal-200/70 text-[11px] font-semibold hover:bg-teal-100 transition-colors truncate"
            title="Stolni o'zgartirish"
          >
            <Armchair className="w-3 h-3 shrink-0" />
            {orderType === 'DINE_IN'
              ? selectedTable?.name ?? 'Stol tanlash'
              : orderType === 'TAKEAWAY'
                ? 'Olib ketish'
                : 'Yetkazish'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Compact Order Type Switch */}
          <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-lg text-[11px]">
            {(
              [
                { id: 'DINE_IN', label: 'Zal' },
                { id: 'TAKEAWAY', label: 'Olib ketish' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setOrderType(t.id)}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  orderType === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            title="Savatni tozalash (F1)"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-35 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teal Table Header Bar — exact visual match to reference image */}
      <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-[#0F9D8A] text-white text-xs font-semibold grid grid-cols-12 items-center shrink-0">
        <span className="col-span-5">Mahsulot nomi</span>
        <span className="col-span-3 text-center">Soni</span>
        <span className="col-span-4 text-right">Narxi</span>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto px-4 divide-y divide-slate-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
            <p className="text-sm font-semibold text-slate-500">Savat bo'sh</p>
            <p className="text-xs mt-1">Chap tarafdan mahsulotlarni tanlang</p>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div
              key={`${item.itemId}-${idx}`}
              className="py-2.5 grid grid-cols-12 items-center gap-1"
            >
              {/* Name & Unit Price */}
              <div className="col-span-5 min-w-0 pr-1">
                <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                <p className="text-[11px] text-slate-400">
                  {formatCurrency(item.unitPrice, false)} so'm
                </p>
              </div>

              {/* Quantity Controls: gray (-) | qty | teal (+) */}
              <div className="col-span-3 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => updateQuantity(idx, -1)}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Kamaytirish"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-slate-800 w-5 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(idx, 1)}
                  className="w-6 h-6 rounded-full bg-[#0F9D8A] hover:bg-[#0D8A79] text-white flex items-center justify-center active:scale-90 transition-all"
                  aria-label="Ko'paytirish"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Item Total + Remove */}
              <div className="col-span-4 flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                  {formatCurrency(item.totalPrice, false)}
                </span>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals Breakdown */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Oraliq jami</span>
          <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount Row (Interactive) */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <button
            onClick={() => {
              setDiscountInput(String(discountPercent));
              setShowDiscountInput((v) => !v);
            }}
            className="flex items-center gap-1 text-[#0F9D8A] hover:underline font-medium"
          >
            <Percent className="w-3 h-3" />
            Chegirma {discountPercent > 0 ? `(${discountPercent}%)` : `(limit ${cashier.discountLimit}%)`}
          </button>
          <span className={discountAmount > 0 ? 'font-semibold text-rose-600' : 'text-slate-400'}>
            {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : '0 so\'m'}
          </span>
        </div>

        {showDiscountInput && (
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="number"
              min={0}
              max={cashier.discountLimit}
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              className="w-20 h-7 px-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
              placeholder="%"
            />
            {[0, 5, 10].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  setDiscountInput(String(pct));
                  applyDiscountPercent(pct);
                  setShowDiscountInput(false);
                }}
                className="px-2 h-7 rounded-lg bg-white border border-slate-200 hover:border-[#0F9D8A] text-[11px] font-semibold text-slate-700"
              >
                {pct}%
              </button>
            ))}
            <button
              onClick={handleApplyDiscount}
              className="ml-auto px-2.5 h-7 rounded-lg bg-[#0F9D8A] text-white text-[11px] font-semibold"
            >
              OK
            </button>
          </div>
        )}

        {serviceFee > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Xizmat haqi ({settings.serviceFeePercent}%)</span>
            <span className="font-semibold text-slate-800">{formatCurrency(serviceFee)}</span>
          </div>
        )}

        {taxAmount > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Soliq ({settings.taxPercent}%)</span>
            <span className="font-semibold text-slate-800">{formatCurrency(taxAmount)}</span>
          </div>
        )}

        <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
          <span className="text-base font-extrabold text-slate-800">Jami:</span>
          <span className="text-xl font-extrabold text-[#0F9D8A]">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Payment Options Section — large teal square buttons matching reference image */}
      <div className="px-4 pt-3 pb-3.5 border-t border-slate-100 bg-white shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">To'lov usullari</span>
          <button
            disabled={cart.length === 0}
            onClick={() => sendCartToKitchen()}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#0F9D8A] hover:text-[#0D8A79] disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            Oshxonaga yuborish
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {settings.enableCash && (
            <button
              disabled={cart.length === 0}
              onClick={() => openPaymentModal('CASH')}
              className="h-20 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] disabled:opacity-40 text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Banknote className="w-6 h-6" />
              <span className="text-xs font-bold">Naqd pul</span>
            </button>
          )}

          {settings.enableQr && (
            <button
              disabled={cart.length === 0}
              onClick={() => openPaymentModal('QR')}
              className="h-20 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] disabled:opacity-40 text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-xs font-bold">QR to'lov</span>
            </button>
          )}

          {settings.enableCard && (
            <button
              disabled={cart.length === 0}
              onClick={() => openPaymentModal('CARD')}
              className="h-20 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] disabled:opacity-40 text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-bold">Bank kartasi</span>
            </button>
          )}
        </div>

        {settings.enableMixed && (
          <button
            disabled={cart.length === 0}
            onClick={() => openPaymentModal('MIXED')}
            className="mt-2 w-full h-9 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 disabled:opacity-40 text-[#0F9D8A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Aralash to'lov (Naqd + Karta)
          </button>
        )}
      </div>
    </section>
  );
}
