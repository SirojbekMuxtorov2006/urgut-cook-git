'use client';

import { useState } from 'react';
import { Download, Calendar, DollarSign, CreditCard, Smartphone, BookOpen } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const paymentStats = [
    { method: 'Naqd pul (CASH)', amount: 2450000, count: 26, percent: 57, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { method: 'Plastik karta (Uzcard/Humo)', amount: 1120000, count: 14, percent: 26, icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
    { method: 'Click / Payme', amount: 530000, count: 6, percent: 12, icon: Smartphone, color: 'text-purple-600 bg-purple-50' },
    { method: 'Nasiya (Qarzga)', amount: 180000, count: 2, percent: 5, icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
  ];

  const cashierStats = [
    { name: 'Dilshod Aliyev', role: 'Kassir #1', orderCount: 28, totalSales: 2540000 },
    { name: 'Madina Karimova', role: 'Kassir #2', orderCount: 20, totalSales: 1740000 },
  ];

  const handleExport = (type: string) => {
    window.open(`http://localhost:4000/api/reports/${type}/export`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Sarlavha va Eksport */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Moliya va Savdo Tahlili</h1>
          <p className="text-slate-500 text-sm mt-1">To'lov turlari, xodimlar samaradorligi va buxgalteriya hisoboti</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-xl">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'today' ? 'Bugun' : p === 'week' ? 'Haftalik' : 'Oylik'}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleExport('sales')}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Excel Eksport (.csv)
          </button>
        </div>
      </div>

      {/* To'lov usullari taqsimoti */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900">To'lov Usullari Taqsimoti</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentStats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{item.percent}%</span>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-slate-500 font-medium">{item.method}</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(item.amount)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.count} ta chek</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kassirlar bo'yicha savdo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">Kassirlar Bo'yicha Natijalar</h2>
          <span className="text-xs text-slate-400">Jami 2 ta smena</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Xodim</th>
                <th className="py-3 px-4">Roli</th>
                <th className="py-3 px-4 text-center">Buyurtmalar</th>
                <th className="py-3 px-4 text-right">Jami Tushum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cashierStats.map((cashier, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{cashier.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{cashier.role}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">{cashier.orderCount} ta</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(cashier.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
