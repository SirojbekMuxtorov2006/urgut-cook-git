import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, CheckCircle2, X } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../store/pos-store';

export function InventoryPage() {
  const { ingredients, addIngredientStock, addIngredient } = usePosStore();
  const [filterLow, setFilterLow] = useState(false);
  const [stockInId, setStockInId] = useState<string | null>(null);
  const [stockQty, setStockQty] = useState('5');
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', currentStock: 10, minStock: 5, unit: 'kg', costPerUnit: 15000 });

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minStock).length;
  const visible = filterLow ? ingredients.filter((i) => i.currentStock <= i.minStock) : ingredients;

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInId) return;
    await addIngredientStock(stockInId, Number(stockQty || 0));
    setStockInId(null);
    setStockQty('5');
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    await addIngredient(newForm);
    setNewModal(false);
    setNewForm({ name: '', currentStock: 10, minStock: 5, unit: 'kg', costPerUnit: 15000 });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ombor va Xomashyolar</h1>
            <p className="text-xs text-slate-500 mt-0.5">Joriy qoldiqlar va kam qolgan mahsulotlar nazorati</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterLow((v) => !v)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                filterLow
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Kam qolgan ({lowStockCount})
            </button>
            <button
              onClick={() => setNewModal(true)}
              className="h-10 px-4 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Yangi xomashyo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Xomashyo nomi</th>
                  <th className="py-3 px-4 text-right">Joriy qoldiq</th>
                  <th className="py-3 px-4 text-right">Minimal limit</th>
                  <th className="py-3 px-4 text-right">Birlik narxi</th>
                  <th className="py-3 px-4 text-center">Holati</th>
                  <th className="py-3 px-4 text-right">Kirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visible.map((ing) => {
                  const isLow = ing.currentStock <= ing.minStock;
                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isLow ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-[#0F9D8A]'
                            }`}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{ing.name}</p>
                            <p className="text-[11px] text-slate-400">Yangilandi: {ing.updatedAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {ing.currentStock} {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                        {ing.minStock} {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-semibold text-slate-700">
                        {formatCurrency(ing.costPerUnit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Kam qolgan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Yetarli
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setStockInId(ing.id)}
                          className="px-3 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0F9D8A] border border-teal-200 text-xs font-bold"
                        >
                          + Kirim
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

      {/* Stock In Modal */}
      {stockInId && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleStockIn}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Omborga kirim qo'shish</h3>
              <button type="button" onClick={() => setStockInId(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Miqdori</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockInId(null)}
                className="px-4 h-9 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 h-9 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold"
              >
                Tasdiqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Ingredient Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNew}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-3 shadow-xl text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">Yangi xomashyo qo'shish</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nomi</label>
              <input
                required
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                placeholder="Masalan: Sariq sabzi"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Qoldiq</label>
                <input
                  type="number"
                  value={newForm.currentStock}
                  onChange={(e) => setNewForm({ ...newForm, currentStock: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Min limit</label>
                <input
                  type="number"
                  value={newForm.minStock}
                  onChange={(e) => setNewForm({ ...newForm, minStock: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Birlik</label>
                <select
                  value={newForm.unit}
                  onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })}
                  className="w-full h-10 px-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="litr">litr</option>
                  <option value="dona">dona</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewModal(false)}
                className="px-4 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 h-9 rounded-xl bg-[#0F9D8A] text-white font-bold"
              >
                Qo'shish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
