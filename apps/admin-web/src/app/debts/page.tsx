'use client';

import { useState } from 'react';
import { Search, Plus, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

interface Debtor {
  id: string;
  name: string;
  phone: string;
  debtBalance: number;
}

export default function DebtsPage() {
  const [search, setSearch] = useState('');
  const [debtors, setDebtors] = useState<Debtor[]>([
    { id: '1', name: 'Alisher Usmonov', phone: '+998 90 123 45 67', debtBalance: 280000 },
    { id: '2', name: 'Shavkat Jo\'rayev', phone: '+998 93 456 78 90', debtBalance: 145000 },
    { id: '3', name: 'Baxtiyor Aka (Usta)', phone: '+998 97 789 01 23', debtBalance: 75000 },
  ]);

  const totalDebt = debtors.reduce((sum, d) => sum + d.debtBalance, 0);

  const filtered = debtors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Sarlavha va Umumiy Qarz */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nasiya (Qarz) Daftari</h1>
          <p className="text-slate-500 text-sm mt-1">Mijozlar qarzdorligi, qisman to'lovlar va hisob-kitoblar</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-[11px] font-semibold text-amber-700 uppercase">Jami Nasiya Qoldig'i</p>
            <p className="text-lg font-bold text-amber-900 leading-tight">{formatCurrency(totalDebt)}</p>
          </div>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Mijoz ismi yoki telefon raqami..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </div>

        <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 transition-all">
          <Plus className="w-4 h-4" />
          Yangi Qarzdor Qo'shish
        </button>
      </div>

      {/* Qarzdorlar jadvali */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-5">Mijoz Ismi</th>
              <th className="py-3 px-4">Telefon</th>
              <th className="py-3 px-4 text-right">Qarz Balansi</th>
              <th className="py-3 px-5 text-right">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-5 font-semibold text-slate-900">{d.name}</td>
                <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {d.phone}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-amber-700">{formatCurrency(d.debtBalance)}</td>
                <td className="py-3.5 px-5 text-right">
                  <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors">
                    Qarzni To'lash
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
