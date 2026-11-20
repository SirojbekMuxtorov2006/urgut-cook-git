import React from 'react';
import { Printer, Leaf, Clock } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../../store/pos-store';
import { printReceiptNative } from '../../lib/api';

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Naqd pul',
  CARD: 'Bank kartasi',
  QR: 'QR to\'lov (Click/Payme)',
  MIXED: 'Aralash to\'lov',
  DEBT: 'Nasiya',
};

export function ReceiptPreview() {
  const {
    cart,
    orderType,
    selectedTable,
    cashier,
    settings,
    discountAmount,
    getSubtotal,
    getServiceFee,
    getTaxAmount,
    getTotal,
    lastCompletedOrder,
    orderCounter,
    showToast,
  } = usePosStore();

  const showingCompleted = cart.length === 0 && lastCompletedOrder !== null;

  const displayOrderNumber = showingCompleted
    ? lastCompletedOrder.orderNumber
    : `K1-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(orderCounter + 1).padStart(4, '0')}`;

  const displayTable = showingCompleted
    ? lastCompletedOrder.tableName
    : orderType === 'DINE_IN'
      ? selectedTable?.name ?? 'Zal'
      : orderType === 'TAKEAWAY'
        ? 'Olib ketish'
        : 'Yetkazib berish';

  const displayItems = showingCompleted
    ? lastCompletedOrder.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      }))
    : cart.map((c) => ({
        name: c.name,
        quantity: c.quantity,
        totalPrice: c.totalPrice,
      }));

  const subtotal = showingCompleted ? lastCompletedOrder.subtotal : getSubtotal();
  const discount = showingCompleted ? lastCompletedOrder.discountAmount : discountAmount;
  const serviceFee = showingCompleted ? lastCompletedOrder.serviceFee : getServiceFee();
  const tax = showingCompleted ? 0 : getTaxAmount();
  const total = showingCompleted ? lastCompletedOrder.total : getTotal();

  const dateStr = new Date(showingCompleted ? lastCompletedOrder.createdAt : Date.now()).toLocaleString(
    'uz-UZ',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  const handlePrint = async () => {
    if (displayItems.length === 0) {
      showToast('Chop etish uchun chek bo\'sh', 'error');
      return;
    }
    const textPayload = [
      settings.restaurantName,
      `Chek: #${displayOrderNumber}`,
      `Sana: ${dateStr}`,
      `Stol: ${displayTable}`,
      '----------------------------',
      ...displayItems.map((i) => `${i.name} x${i.quantity} = ${formatCurrency(i.totalPrice, false)}`),
      '----------------------------',
      `JAMI: ${formatCurrency(total)}`,
      settings.receiptFooter,
    ].join('\n');

    await printReceiptNative(textPayload);
    showToast('Chek printerga yuborildi', 'success');
  };

  return (
    <section className="h-full bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between shrink-0 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">Chek ko'rinishi</h2>
        {showingCompleted && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              lastCompletedOrder.syncState === 'PENDING_SYNC'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {lastCompletedOrder.syncState === 'PENDING_SYNC' ? 'Sinxron kutilmoqda' : 'To\'langan'}
          </span>
        )}
      </div>

      {/* Printable Receipt Body */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col justify-between">
        <div
          id="pos-receipt-printable"
          className="bg-white border border-slate-200 rounded-xl p-4 flex-1 flex flex-col justify-between text-slate-800"
        >
          <div>
            {/* Restaurant Name & Logo */}
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] mb-1">
                <Leaf className="w-4 h-4" />
              </div>
              <p className="text-sm font-extrabold text-slate-900 leading-tight">
                {settings.restaurantName}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{settings.address}</p>
            </div>

            {/* Transaction Info */}
            <div className="py-2.5 border-b border-dashed border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Tranzaksiya:</span>
                <span className="font-bold text-slate-700 font-mono">#{displayOrderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sana:</span>
                <span className="text-slate-600">{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Joy / Stol:</span>
                <span className="font-semibold text-slate-700">{displayTable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kassir:</span>
                <span className="text-slate-600">{cashier.name}</span>
              </div>
            </div>

            {/* Product List */}
            <div className="py-2.5 border-b border-dashed border-slate-200 space-y-1.5">
              {displayItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">
                  Mahsulotlar tanlanganda chek bu yerda ko'rinadi
                </p>
              ) : (
                displayItems.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 text-[11px]">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    </div>
                    <span className="text-slate-500 font-medium shrink-0">x{item.quantity}</span>
                    <span className="font-bold text-slate-800 shrink-0 tabular-nums">
                      {formatCurrency(item.totalPrice, false)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="pt-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Oraliq jami</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Chegirma</span>
                  <span className="tabular-nums">-{formatCurrency(discount)}</span>
                </div>
              )}
              {serviceFee > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Xizmat haqi</span>
                  <span className="tabular-nums">{formatCurrency(serviceFee)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Soliq</span>
                  <span className="tabular-nums">{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-slate-200">
                <span className="text-xs font-extrabold text-slate-900">Jami:</span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>

              {showingCompleted && lastCompletedOrder.paymentMethod && (
                <div className="pt-2 mt-1 border-t border-dashed border-slate-200 text-[11px] space-y-0.5">
                  <div className="flex justify-between text-slate-600">
                    <span>To'lov turi:</span>
                    <span className="font-semibold">
                      {PAYMENT_LABELS[lastCompletedOrder.paymentMethod] || lastCompletedOrder.paymentMethod}
                    </span>
                  </div>
                  {lastCompletedOrder.changeAmount !== undefined && lastCompletedOrder.changeAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Qaytim:</span>
                      <span>{formatCurrency(lastCompletedOrder.changeAmount)}</span>
                    </div>
                  )}
                  {lastCompletedOrder.syncState === 'PENDING_SYNC' && (
                    <div className="flex items-center gap-1 text-amber-700 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Offline saqlandi — sinxron kutilmoqda</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer + Barcode (matches reference image) */}
          <div className="pt-4 mt-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={displayItems.length === 0}
              className="w-full h-11 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] disabled:opacity-40 text-white text-xs font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Chek chiqarish
            </button>

            {/* Clean Barcode SVG */}
            <div className="mt-3 flex flex-col items-center">
              <svg viewBox="0 0 180 34" className="w-40 h-8 text-slate-800" aria-hidden="true">
                {[
                  2, 5, 10, 12, 16, 21, 24, 29, 32, 36, 40, 46, 49, 53, 58, 61, 66, 70, 75, 78, 84,
                  88, 92, 97, 101, 106, 111, 114, 119, 123, 128, 132, 136, 141, 145, 150, 155, 158,
                  163, 168, 173,
                ].map((x, idx) => (
                  <rect
                    key={x}
                    x={x}
                    y={2}
                    width={idx % 3 === 0 ? 3 : idx % 2 === 0 ? 2 : 1.2}
                    height={28}
                    fill="currentColor"
                  />
                ))}
              </svg>
              <span className="text-[10px] font-mono text-slate-400 tracking-widest">
                {displayOrderNumber}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
