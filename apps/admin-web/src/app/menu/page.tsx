'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, AlertCircle, CheckCircle2, UtensilsCrossed } from 'lucide-react';
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
    { id: '1', name: 'Choyxona Oshi', category: 'Ikkinchi taomlar', price: 38000, costPrice: 22000, isAvailable: true },
    { id: '2', name: 'To\'y Oshi', category: 'Ikkinchi taomlar', price: 42000, costPrice: 24500, isAvailable: true },
    { id: '3', name: 'Qovurma Lag\'mon', category: 'Ikkinchi taomlar', price: 38000, costPrice: 21000, isAvailable: true },
    { id: '4', name: 'Qo\'y go\'shtli Sho\'rva', category: 'Birinchi taomlar', price: 35000, costPrice: 19000, isAvailable: true },
    { id: '5', name: 'Kuskovoy Shashlik', category: 'Shashliklar', price: 22000, costPrice: 13500, isAvailable: true },
    { id: '6', name: 'Tandir Somsa', category: 'Non va somsa', price: 12000, costPrice: 6500, isAvailable: false },
  ]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const toggleAvailability = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i)));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) return;
    setItems((prev) => [
      {
        id: String(Date.now()),
        name: newName.trim(),
        category: 'Ikkinchi taomlar',
        price: Number(newPrice),
        costPrice: Math.round(Number(newPrice) * 0.55),
        isAvailable: true,
      },
      ...prev,
    ]);
    setNewName('');
    setNewPrice('');
    setShowAdd(false);
  };

  const filteredItems = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mahsulotlar va Menyu</h1>
          <p className="text-xs text-slate-500 mt-0.5">Sotuv narxi, kategoriya va mavjudlik boshqaruvi</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Taom qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0F9D8A] bg-white"
            />
          </div>

          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 bg-[#0F9D8A] hover:bg-[#0D8A79] text-white px-4 h-10 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yangi mahsulot
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3">
          <input
            required
            placeholder="Mahsulot nomi"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[180px] h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0F9D8A]"
          />
          <input
            required
            type="number"
            placeholder="Narxi (so'm)"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-40 h-10 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0F9D8A]"
          />
          <button type="submit" className="h-10 px-4 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold">
            Qo'shish
          </button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                <th className="py-3 px-5">Mahsulot</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4 text-right">Sotuv narxi</th>
                <th className="py-3 px-4 text-right">Tannarx</th>
                <th className="py-3 px-4 text-center">Holati</th>
                <th className="py-3 px-5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0F9D8A] text-white flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">{item.category}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(item.price)}</td>
                  <td className="py-3.5 px-4 text-right text-slate-500 text-xs">{formatCurrency(item.costPrice)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mavjud
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Tugagan
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-[#0F9D8A] hover:bg-teal-50">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
