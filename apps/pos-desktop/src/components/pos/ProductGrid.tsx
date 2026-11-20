import React, { useState, useRef, useEffect } from 'react';
import { Search, Star } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../../store/pos-store';
import { FoodArtwork } from '../FoodArtwork';

export function ProductGrid() {
  const { products, categories, addToCart, toggleFavorite } = usePosStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('FAVORITES');
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (search.trim().length > 0) return true;
    if (selectedCategory === 'FAVORITES') return p.isFavorite;
    if (selectedCategory === 'ALL') return true;
    return p.categoryId === selectedCategory;
  });

  const tabs = [
    { id: 'FAVORITES', label: 'Sevimlilar' },
    { id: 'ALL', label: 'Barchasi' },
    ...categories.map((c) => ({ id: c.id, label: c.name })),
  ];

  return (
    <section className="h-full bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Header Row: Title + Search (matches reference image) */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-3 shrink-0">
        <h2 className="text-base font-bold text-slate-800 whitespace-nowrap">Mahsulotlar</h2>
        <div className="relative flex-1 max-w-[230px]">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish... (F2)"
            className="w-full h-9 pl-3 pr-8 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0F9D8A] transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto shrink-0 border-b border-slate-100">
        {tabs.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#0F9D8A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid (Teal upper visual block + Crisp white lower info block) */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
            <p className="text-sm font-semibold text-slate-500">Mahsulot topilmadi</p>
            <p className="text-xs mt-1">Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addToCart(product);
                  }
                }}
                className={`group relative rounded-xl border overflow-hidden bg-white flex flex-col text-left transition-all cursor-pointer select-none active:scale-[0.98] ${
                  product.isAvailable
                    ? 'border-slate-200 hover:border-[#0F9D8A] hover:shadow-sm'
                    : 'border-slate-200 opacity-55 cursor-not-allowed'
                }`}
              >
                {/* Favorite Star */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  title="Sevimlilarga qo'shish"
                  className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center transition-colors"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      product.isFavorite ? 'fill-amber-300 text-amber-300' : 'text-white/80'
                    }`}
                  />
                </button>

                {/* Teal Visual Container (matches reference image) */}
                <div className="h-24 bg-[#0F9D8A] group-hover:bg-[#0D8A79] transition-colors flex items-center justify-center p-2 relative">
                  <FoodArtwork type={product.artwork} className="w-16 h-16 drop-shadow-sm" />
                  {!product.isAvailable && (
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                      Tugagan
                    </span>
                  )}
                </div>

                {/* White Info Strip */}
                <div className="p-2.5 bg-white flex-1 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
