'use client';

import { useState } from 'react';
import { Clock, Armchair, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

interface OrderRow {
  id: string;
  number: string;
  table: string;
  time: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'PAID';
  total: number;
  items: string[];
}

const STATUS_STYLE = {
  NEW: { label: 'Yangi', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  PREPARING: { label: 'Tayyorlanmoqda', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  READY: { label: 'Tayyor', cls: 'bg-teal-50 text-[#0F9D8A] border-teal-200' },
  PAID: { label: 'To\'langan', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<'ALL' | OrderRow['status']>('ALL');
  const [orders, setOrders] = useState<OrderRow[]>([
    { id: '1', number: 'K1-1120-0014', table: 'Stol #7', time: '14:22', status: 'PREPARING', total: 103400, items: ['Choyxona Oshi x2', 'Achchiq-chuchuk x1', 'Ko\'k Choy x1'] },
    { id: '2', number: 'K1-1120-0013', table: 'VIP #2', time: '14:15', status: 'NEW', total: 253000, items: ['Qozon Kabob x2', 'Kuskovoy Shashlik x4'] },
    { id: '3', number: 'K1-1120-0012', table: 'Stol #6', time: '14:04', status: 'READY', total: 182600, items: ['Choyxona Oshi x2', 'Shashlik x3'] },
    { id: '4', number: 'K1-1120-0011', table: 'Olib ketish', time: '13:45', status: 'PAID', total: 88000, items: ['Tandir Somsa x6', 'Coca-Cola x1'] },
  ]);

  const advance = (id: string, status: OrderRow['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Buyurtmalar</h1>
        <p className="text-xs text-slate-500 mt-0.5">Barcha buyurtmalar va ularning joriy holati</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'ALL', label: 'Barchasi' },
            { id: 'NEW', label: 'Yangi' },
            { id: 'PREPARING', label: 'Tayyorlanmoqda' },
            { id: 'READY', label: 'Tayyor' },
            { id: 'PAID', label: 'To\'langan' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold ${
              filter === tab.id ? 'bg-[#0F9D8A] text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ord) => {
          const st = STATUS_STYLE[ord.status];
          return (
            <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <p className="font-mono font-extrabold text-sm text-slate-900">#{ord.number}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-[#0F9D8A]" />{ord.table}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{ord.time}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.cls}`}>{st.label}</span>
                </div>
                <ul className="py-3 space-y-1 text-xs text-slate-700">
                  {ord.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-base font-extrabold text-[#0F9D8A]">{formatCurrency(ord.total)}</span>
                {ord.status !== 'PAID' && (
                  <button
                    onClick={() => advance(ord.id, ord.status === 'READY' ? 'PAID' : 'READY')}
                    className="h-9 px-3.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ord.status === 'READY' ? 'To\'landi' : 'Tayyor'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
