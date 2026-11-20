'use client';

import { useState } from 'react';
import { Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([
    { id: '1', name: 'Mol go\'shti (lahm)', currentStock: 18.5, minStock: 10, unit: 'kg' },
    { id: '2', name: 'Qo\'y go\'shti', currentStock: 6.2, minStock: 8, unit: 'kg' },
    { id: '3', name: 'Lazer guruch', currentStock: 34, minStock: 15, unit: 'kg' },
    { id: '4', name: 'Sariq sabzi', currentStock: 22, minStock: 12, unit: 'kg' },
    { id: '5', name: 'Paxta yog\'i', currentStock: 8.5, minStock: 10, unit: 'litr' },
    { id: '6', name: 'Pomidor', currentStock: 4.5, minStock: 8, unit: 'kg' },
  ]);

  const addFive = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, currentStock: Number((i.currentStock + 5).toFixed(1)) } : i)),
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Ombor</h1>
        <p className="text-xs text-slate-500 mt-0.5">Xomashyolar qoldig'i va kam qolgan mahsulotlar</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-3 px-5">Xomashyo</th>
              <th className="py-3 px-4 text-right">Joriy qoldiq</th>
              <th className="py-3 px-4 text-right">Minimal limit</th>
              <th className="py-3 px-4 text-center">Holati</th>
              <th className="py-3 px-5 text-right">Tezkor kirim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.map((ing) => {
              const isLow = ing.currentStock <= ing.minStock;
              return (
                <tr key={ing.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-5 font-semibold text-slate-900 flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLow ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-[#0F9D8A]'}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    {ing.name}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    {ing.currentStock} {ing.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                    {ing.minStock} {ing.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Kam qolgan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yetarli
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => addFive(ing.id)}
                      className="px-3 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0F9D8A] border border-teal-200 text-xs font-bold"
                    >
                      +5 {ing.unit}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
