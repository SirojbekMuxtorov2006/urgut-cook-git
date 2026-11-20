'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

interface MenuItemDisplay {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  isAvailable: boolean;
}

export default function MenuManagementPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MenuItemDisplay[]>([
    { id: '1', name: 'Choyxona Oshi', category: 'Ikkinchi taomlar', price: 38000, costPrice: 23000, isAvailable: true },
    { id: '2', name: 'To\'y Oshi', category: 'Ikkinchi taomlar', price: 42000, costPrice: 25000, isAvailable: true },
    { id: '3', name: 'Qovurma Lag\'mon', category: 'Ikkinchi taomlar', price: 38000, costPrice: 22000, isAvailable: true },
    { id: '4', name: 'Qo\'y go\'shtli Sho\'rva', category: 'Birinchi taomlar', price: 35000, costPrice: 21000, isAvailable: true },
    { id: '5', name: 'Kuskovoy Shashlik', category: 'Shashliklar', price: 22000, costPrice: 14000, isAvailable: true },
    { id: '6', name: 'Tandir Somsa', category: 'Non va somsa', price: 12000, costPrice: 6500, isAvailable: false },
  ]);

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i)),
    );
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Menyu va Narxlar Boshqaruvi</h1>
          <p className="text-slate-500 text-sm mt-1">Sotuv narxi, tannarx kalkulyatsiyasi va mavjudlik nazorati</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Taom qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-orange-600/20 transition-all">
            <Plus className="w-4 h-4" />
            Yangi Taom
          </button>
        </div>
      </div>

      {/* Jadval */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-5">Taom Nomi</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4 text-right">Sotuv Narxi</th>
                <th className="py-3 px-4 text-right">Tannarx</th>
                <th className="py-3 px-4 text-center">Foyda / Ustama</th>
                <th className="py-3 px-4 text-center">Holati</th>
                <th className="py-3 px-5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => {
                const profit = item.price - item.costPrice;
                const margin = Math.round((profit / item.costPrice) * 100);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{item.category}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(item.price)}</td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-medium">{formatCurrency(item.costPrice)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        +{margin}% ({formatCurrency(profit, false)})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleAvailability(item.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mavjud
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            Tugagan
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
