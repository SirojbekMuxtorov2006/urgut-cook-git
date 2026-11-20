import React, { useState } from 'react';
import { Search, Plus, Edit2, CheckCircle2, AlertCircle, X, Tag } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../store/pos-store';
import { FoodArtwork } from '../components/FoodArtwork';
import type { FoodArtworkType, Product } from '../data/catalog';

const ARTWORK_OPTIONS: { value: FoodArtworkType; label: string }[] = [
  { value: 'plov', label: 'Osh / Palov' },
  { value: 'lagman', label: 'Lag\'mon' },
  { value: 'manti', label: 'Manti' },
  { value: 'kabob', label: 'Kabob / Go\'sht' },
  { value: 'soup', label: 'Sho\'rva' },
  { value: 'shashlik', label: 'Shashlik' },
  { value: 'salad', label: 'Salat' },
  { value: 'somsa', label: 'Somsa' },
  { value: 'bread', label: 'Non' },
  { value: 'tea', label: 'Choy' },
  { value: 'drink', label: 'Ichimlik' },
];

export function ProductsPage() {
  const { products, categories, toggleProductAvailability, saveProduct, saveCategory } = usePosStore();
  const [subTab, setSubTab] = useState<'products' | 'categories'>('products');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  // Category modal state
  const [editingCategory, setEditingCategory] = useState<{ id?: string; name: string } | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchCat = catFilter === 'ALL' || p.categoryId === catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.price) return;
    await saveProduct({
      id: editingProduct.id,
      name: editingProduct.name,
      categoryId: editingProduct.categoryId || categories[0]?.id || '1',
      price: Number(editingProduct.price),
      costPrice: Number(editingProduct.costPrice || Math.round(Number(editingProduct.price) * 0.55)),
      isAvailable: editingProduct.isAvailable ?? true,
      isFavorite: editingProduct.isFavorite ?? false,
      artwork: editingProduct.artwork || 'plov',
      station: editingProduct.station || 'KITCHEN_HOT',
    });
    setEditingProduct(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name.trim()) return;
    await saveCategory({ id: editingCategory.id, name: editingCategory.name.trim() });
    setEditingCategory(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mahsulotlar va Kategoriyalar</h1>
            <p className="text-xs text-slate-500 mt-0.5">Menyu ro'yxati, narxlar va mavjudlik nazorati</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setSubTab('products')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  subTab === 'products' ? 'bg-[#0F9D8A] text-white' : 'text-slate-600'
                }`}
              >
                Mahsulotlar ({products.length})
              </button>
              <button
                onClick={() => setSubTab('categories')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  subTab === 'categories' ? 'bg-[#0F9D8A] text-white' : 'text-slate-600'
                }`}
              >
                Kategoriyalar ({categories.length})
              </button>
            </div>

            {subTab === 'products' ? (
              <button
                onClick={() =>
                  setEditingProduct({
                    name: '',
                    categoryId: categories[0]?.id || '1',
                    price: 25000,
                    costPrice: 14000,
                    isAvailable: true,
                    isFavorite: false,
                    artwork: 'plov',
                    station: 'KITCHEN_HOT',
                  })
                }
                className="h-10 px-4 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Yangi mahsulot
              </button>
            ) : (
              <button
                onClick={() => setEditingCategory({ name: '' })}
                className="h-10 px-4 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Yangi kategoriya
              </button>
            )}
          </div>
        </div>

        {subTab === 'products' ? (
          <>
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setCatFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                    catFilter === 'ALL'
                      ? 'bg-[#0F9D8A] text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Barchasi
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCatFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                      catFilter === cat.id
                        ? 'bg-[#0F9D8A] text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Taom qidirish..."
                  className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#0F9D8A]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Mahsulot</th>
                      <th className="py-3 px-4">Kategoriya</th>
                      <th className="py-3 px-4 text-right">Narxi</th>
                      <th className="py-3 px-4 text-center">Mavjudligi</th>
                      <th className="py-3 px-4 text-right">Tahrirlash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredProducts.map((product) => {
                      const catName =
                        categories.find((c) => c.id === product.categoryId)?.name || 'Boshqa';
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#0F9D8A] flex items-center justify-center shrink-0">
                                <FoodArtwork type={product.artwork} className="w-7 h-7" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{product.name}</p>
                                <p className="text-[11px] text-slate-400">
                                  Tannarx: {formatCurrency(product.costPrice)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-600">{catName}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleProductAvailability(product.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                product.isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {product.isAvailable ? (
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
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#0F9D8A] hover:bg-teal-50 transition-colors"
                            >
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
          </>
        ) : (
          /* Categories Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                      <p className="text-xs text-slate-500">{count} ta mahsulot</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                    className="p-2 rounded-lg text-slate-500 hover:text-[#0F9D8A] hover:bg-teal-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mahsulot nomi</label>
                <input
                  required
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  placeholder="Masalan: Choyxona Oshi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategoriya</label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0F9D8A]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rasm turi</label>
                  <select
                    value={editingProduct.artwork || 'plov'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        artwork: e.target.value as FoodArtworkType,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#0F9D8A]"
                  >
                    {ARTWORK_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sotuv narxi (so'm)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tannarx (so'm)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.costPrice || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 h-10 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900">
              {editingCategory.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </h3>
            <input
              required
              type="text"
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              placeholder="Kategoriya nomi"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#0F9D8A]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 h-9 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Yopish
              </button>
              <button
                type="submit"
                className="px-4 h-9 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
