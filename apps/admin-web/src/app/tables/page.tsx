'use client';

import { useState } from 'react';
import { Armchair, Users } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

interface TableCard {
  id: string;
  name: string;
  hall: string;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  total?: number;
}

const META = {
  AVAILABLE: { label: 'Bo\'sh', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-200' },
  OCCUPIED: { label: 'Band', badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-rose-200' },
  RESERVED: { label: 'Bron', badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-200' },
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableCard[]>([
    { id: '1', name: 'Stol #1', hall: 'Asosiy zal', seats: 4, status: 'AVAILABLE' },
    { id: '2', name: 'Stol #2', hall: 'Asosiy zal', seats: 4, status: 'OCCUPIED', total: 118000 },
    { id: '3', name: 'Stol #3', hall: 'Asosiy zal', seats: 6, status: 'AVAILABLE' },
    { id: '4', name: 'Stol #4', hall: 'Asosiy zal', seats: 4, status: 'RESERVED' },
    { id: '5', name: 'Stol #5', hall: 'Asosiy zal', seats: 6, status: 'AVAILABLE' },
    { id: '6', name: 'Stol #6', hall: 'Asosiy zal', seats: 4, status: 'OCCUPIED', total: 182600 },
    { id: '7', name: 'VIP #1', hall: 'VIP xonalar', seats: 10, status: 'RESERVED' },
    { id: '8', name: 'VIP #2', hall: 'VIP xonalar', seats: 12, status: 'OCCUPIED', total: 253000 },
  ]);

  const setStatus = (id: string, status: TableCard['status']) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Stollar</h1>
        <p className="text-xs text-slate-500 mt-0.5">Bo'sh, band va bron qilingan stollar holati</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tables.map((t) => {
          const m = META[t.status];
          return (
            <div key={t.id} className={`bg-white rounded-2xl border p-4 space-y-4 ${m.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                    <p className="text-[11px] text-slate-500">{t.hall}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${m.badge}`}>{m.label}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{t.seats} o'rin</span>
                <span className="font-bold text-slate-900">{t.total ? formatCurrency(t.total) : 'Bo\'sh'}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                {(['AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatus(t.id, st)}
                    className={`h-8 rounded-lg text-[11px] font-semibold border ${
                      t.status === st ? 'bg-[#0F9D8A] text-white border-[#0F9D8A]' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {META[st].label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
