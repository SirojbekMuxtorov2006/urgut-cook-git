import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Banknote,
  CreditCard,
  QrCode,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../store/pos-store';

export function ReportsPage() {
  const { orders, cashMovements, addCashMovement } = usePosStore();
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const todaySales = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const cashTotal = paidOrders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.total, 0) +
    paidOrders
      .filter((o) => o.paymentMethod === 'MIXED')
      .reduce((sum, o) => sum + (o.mixedCashAmount || 0), 0);
  const cardTotal = paidOrders
    .filter((o) => o.paymentMethod === 'CARD')
    .reduce((sum, o) => sum + o.total, 0) +
    paidOrders
      .filter((o) => o.paymentMethod === 'MIXED')
      .reduce((sum, o) => sum + (o.mixedCardAmount || 0), 0);
  const qrTotal = paidOrders
    .filter((o) => o.paymentMethod === 'QR')
    .reduce((sum, o) => sum + o.total, 0);

  const expensesTotal = cashMovements
    .filter((m) => m.type === 'EXPENSE' || m.type === 'CASH_OUT')
    .reduce((sum, m) => sum + m.amount, 0);

  const hourlyBars = [
    { hour: '10:00', pct: 20 },
    { hour: '11:00', pct: 40 },
    { hour: '12:00', pct: 85 },
    { hour: '13:00', pct: 100 },
    { hour: '14:00', pct: 68 },
    { hour: '15:00', pct: 32 },
    { hour: '16:00', pct: 28 },
    { hour: '17:00', pct: 45 },
    { hour: '18:00', pct: 78 },
    { hour: '19:00', pct: 92 },
    { hour: '20:00', pct: 62 },
  ];

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;
    await addCashMovement({
      type: 'EXPENSE',
      title: expenseTitle.trim(),
      amount: Number(expenseAmount),
      method: 'CASH',
    });
    setExpenseTitle('');
    setExpenseAmount('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hisobotlar va Moliya</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bugungi savdo ko'rsatkichlari, to'lov turlari va kassa harakatlari
          </p>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Bugungi tushum</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-3">{formatCurrency(todaySales)}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Sof qoldiq: {formatCurrency(Math.max(0, todaySales - expensesTotal))}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Buyurtmalar soni</span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-3">{orders.length} ta</p>
            <p className="text-xs text-slate-500 mt-1">{paidOrders.length} ta to'langan</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Naqd pul to'lovlari</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-3">{formatCurrency(cashTotal)}</p>
            <p className="text-xs text-rose-600 font-medium mt-1">
              Xarajatlar: -{formatCurrency(expensesTotal)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Karta va QR to'lovlar</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-3">
              {formatCurrency(cardTotal + qrTotal)}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Karta: {formatCurrency(cardTotal, false)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-0.5">
                <QrCode className="w-3 h-3" /> {formatCurrency(qrTotal, false)}
              </span>
            </p>
          </div>
        </div>

        {/* Chart + Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bugungi soatlik savdo grafigi</h2>
                <p className="text-xs text-slate-500">Kun davomidagi buyurtmalar dinamikasi</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#0F9D8A] text-xs font-bold">
                Bugun
              </span>
            </div>

            <div className="h-52 flex items-end gap-2.5 pt-4 border-b border-slate-100">
              {hourlyBars.map((b) => (
                <div key={b.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: `${b.pct}%` }}
                    className="w-full rounded-t-lg bg-[#0F9D8A]/85 hover:bg-[#0F9D8A] transition-colors"
                  />
                  <span className="text-[10px] font-medium text-slate-400">{b.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Movements & Quick Expense */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kassa harakatlari</h2>
              <p className="text-xs text-slate-500 mt-0.5">Kirim va kunlik xarajatlar</p>

              <form onSubmit={handleAddExpense} className="mt-3 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Xarajat nomi"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0F9D8A]"
                />
                <input
                  type="number"
                  placeholder="Summa"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-24 h-9 px-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#0F9D8A]"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-lg bg-[#0F9D8A] hover:bg-[#0D8A79] text-white flex items-center justify-center shrink-0"
                  title="Xarajat qo'shish"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {cashMovements.slice(0, 6).map((m) => {
                  const isOut = m.type === 'EXPENSE' || m.type === 'CASH_OUT';
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isOut ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isOut ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{m.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {m.createdAt} • {m.user}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold shrink-0 ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}
                      >
                        {isOut ? '-' : '+'}
                        {formatCurrency(m.amount, false)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
