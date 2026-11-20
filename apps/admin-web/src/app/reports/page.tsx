'use client';

import { useState } from 'react';
import { Download, Banknote, CreditCard, QrCode, BookOpen } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const paymentStats = [
    { method: 'Naqd pul', amount: 2450000, count: 26, percent: 57, icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
    { method: 'Bank kartasi', amount: 1120000, count: 14, percent: 26, icon: CreditCard, color: 'text-[#0F9D8A] bg-teal-50' },
    { method: 'QR to\'lov (Click/Payme)', amount: 530000, count: 6, percent: 12, icon: QrCode, color: 'text-sky-600 bg-sky-50' },
    { method: 'Nasiya', amount: 180000, count: 2, percent: 5, icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
  ];

  const cashierStats = [
    { name: 'Dilshod Aliyev', role: 'Kassir #1', orderCount: 28, totalSales: 2540000 },
    { name: 'Madina Karimova', role: 'Kassir #2', orderCount: 20, totalSales: 1740000 },
  ];

  const handleExport = (type: string) => {
    window.open(`http://localhost:4000/api/reports/${type}/export`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hisobotlar va Moliya</h1>
          <p className="text-xs text-slate-500 mt-0.5">To'lov turlari, kunlik tushum va kassirlar natijalari</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === p ? 'bg-[#0F9D8A] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p === 'today' ? 'Bugun' : p === 'week' ? 'Haftalik' : 'Oylik'}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleExport('sales')}
            className="flex items-center gap-1.5 bg-[#0F9D8A] hover:bg-[#0D8A79] text-white px-4 h-10 rounded-xl text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            Excel (.csv)
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 space-y-4">
        <h2 className="text-base font-bold text-slate-900">To'lov usullari taqsimoti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentStats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{item.percent}%</span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-3">{item.method}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatCurrency(item.amount)}</p>
                <p className="text-[11px] text-slate-400">{item.count} ta chek</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/90">
        <h2 className="text-base font-bold text-slate-900 mb-4">Kassirlar bo'yicha natijalar</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                <th className="py-3 px-4">Xodim</th>
                <th className="py-3 px-4">Roli</th>
                <th className="py-3 px-4 text-center">Buyurtmalar</th>
                <th className="py-3 px-4 text-right">Jami tushum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cashierStats.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{c.role}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">{c.orderCount} ta</td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#0F9D8A]">{formatCurrency(c.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
