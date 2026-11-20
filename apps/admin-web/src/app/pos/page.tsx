'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  Banknote,
  QrCode,
  CreditCard,
  Printer,
  Leaf,
  UtensilsCrossed,
} from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

interface WebProduct {
  id: string;
  category: string;
  name: string;
  price: number;
  favorite?: boolean;
}

const PRODUCTS: WebProduct[] = [
  { id: '1', category: 'Ikkinchi taomlar', name: 'Choyxona Oshi', price: 38000, favorite: true },
  { id: '2', category: 'Ikkinchi taomlar', name: 'To\'y Oshi', price: 42000, favorite: true },
  { id: '3', category: 'Ikkinchi taomlar', name: 'Qovurma Lag\'mon', price: 38000, favorite: true },
  { id: '4', category: 'Ikkinchi taomlar', name: 'Qozon Kabob', price: 65000, favorite: true },
  { id: '5', category: 'Birinchi taomlar', name: 'Qo\'y go\'shtli Sho\'rva', price: 35000, favorite: true },
  { id: '6', category: 'Shashliklar', name: 'Kuskovoy Shashlik', price: 22000, favorite: true },
  { id: '7', category: 'Shashliklar', name: 'Qiyma Shashlik', price: 16000 },
  { id: '8', category: 'Salatlar', name: 'Achchiq-chuchuk', price: 12000, favorite: true },
  { id: '9', category: 'Non va somsa', name: 'Tandir Somsa', price: 12000, favorite: true },
  { id: '10', category: 'Non va somsa', name: 'Tandir Non', price: 5000 },
  { id: '11', category: 'Ichimliklar', name: 'Ko\'k Choy (1L)', price: 6000, favorite: true },
  { id: '12', category: 'Ichimliklar', name: 'Coca-Cola 1.5L', price: 16000 },
];

export default function WebPosPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Sevimlilar');
  const [cart, setCart] = useState<{ item: WebProduct; qty: number }[]>([
    { item: PRODUCTS[0], qty: 2 },
    { item: PRODUCTS[7], qty: 1 },
    { item: PRODUCTS[10], qty: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'Naqd pul' | 'QR to\'lov' | 'Bank kartasi'>('Naqd pul');
  const [message, setMessage] = useState<string | null>(null);

  const categories = ['Sevimlilar', 'Barchasi', 'Ikkinchi taomlar', 'Birinchi taomlar', 'Shashliklar', 'Salatlar', 'Non va somsa', 'Ichimliklar'];

  const filtered = PRODUCTS.filter((p) => {
    if (search.trim()) return p.name.toLowerCase().includes(search.toLowerCase());
    if (category === 'Sevimlilar') return p.favorite;
    if (category === 'Barchasi') return true;
    return p.category === category;
  });

  const addItem = (item: WebProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        return prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c, i) => (i === idx ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const complete = (method: 'Naqd pul' | 'QR to\'lov' | 'Bank kartasi') => {
    if (cart.length === 0) return;
    setPaymentMethod(method);
    setMessage(`${method} orqali ${formatCurrency(total)} qabul qilindi`);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col gap-3">
      {message && (
        <div className="px-4 py-2.5 rounded-xl bg-[#0F9D8A] text-white text-xs font-bold">
          {message}
        </div>
      )}

      {/* 3-Column POS Layout: 42% Products | 33% Cart | 25% Receipt */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0">
        {/* LEFT: Product Grid (42%) */}
        <section className="w-full lg:w-[42%] bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden">
          <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">Mahsulotlar</h2>
            <div className="relative w-48">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full h-9 pl-3 pr-8 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-[#0F9D8A]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto border-b border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                  category === cat ? 'bg-[#0F9D8A] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="rounded-xl border border-slate-200 hover:border-[#0F9D8A] overflow-hidden bg-white flex flex-col text-left active:scale-95 transition-all"
              >
                <div className="h-20 bg-[#0F9D8A] flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-8 h-8 opacity-90" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(p.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* CENTER: Shopping Cart + Payment Options (33%) */}
        <section className="w-full lg:w-[33%] bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden">
          <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Savat</h2>
            <button
              onClick={() => setCart([])}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-[#0F9D8A] text-white text-xs font-semibold grid grid-cols-12">
            <span className="col-span-5">Mahsulot nomi</span>
            <span className="col-span-3 text-center">Soni</span>
            <span className="col-span-4 text-right">Narxi</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 divide-y divide-slate-100">
            {cart.map((c, idx) => (
              <div key={c.item.id} className="py-2.5 grid grid-cols-12 items-center gap-1">
                <div className="col-span-5 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{c.item.name}</p>
                  <p className="text-[11px] text-slate-400">{formatCurrency(c.item.price, false)}</p>
                </div>
                <div className="col-span-3 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => updateQty(idx, -1)}
                    className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 w-4 text-center">{c.qty}</span>
                  <button
                    onClick={() => updateQty(idx, 1)}
                    className="w-6 h-6 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="col-span-4 flex items-center justify-end gap-1">
                  <span className="text-xs font-bold text-slate-800">
                    {formatCurrency(c.item.price * c.qty, false)}
                  </span>
                  <button
                    onClick={() => updateQty(idx, -c.qty)}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Oraliq jami</span>
              <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Xizmat haqi (10%)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-base font-extrabold text-slate-800">Jami:</span>
              <span className="text-xl font-extrabold text-[#0F9D8A]">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">To'lov usullari</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => complete('Naqd pul')}
                className="h-18 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white flex flex-col items-center justify-center gap-1"
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-bold">Naqd pul</span>
              </button>
              <button
                onClick={() => complete('QR to\'lov')}
                className="h-18 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white flex flex-col items-center justify-center gap-1"
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold">QR to'lov</span>
              </button>
              <button
                onClick={() => complete('Bank kartasi')}
                className="h-18 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white flex flex-col items-center justify-center gap-1"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Bank kartasi</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Receipt Preview (25%) */}
        <section className="w-full lg:w-[25%] bg-white rounded-2xl border border-slate-200/90 flex flex-col overflow-hidden">
          <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Chek ko'rinishi</h2>
          </div>

          <div className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto">
            <div className="border border-slate-200 rounded-xl p-4 flex-1 flex flex-col justify-between text-xs">
              <div>
                <div className="text-center pb-3 border-b border-dashed border-slate-200">
                  <div className="inline-flex w-8 h-8 rounded-lg bg-teal-50 text-[#0F9D8A] items-center justify-center mb-1">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <p className="font-extrabold text-slate-900">Rayhon Milliy Taomlari</p>
                  <p className="text-[10px] text-slate-400">Tranzaksiya #K1-1120-0015</p>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-200 space-y-1.5">
                  {cart.map((c) => (
                    <div key={c.item.id} className="flex justify-between gap-2 text-[11px]">
                      <span className="truncate font-semibold text-slate-800">{c.item.name}</span>
                      <span className="text-slate-400">x{c.qty}</span>
                      <span className="font-bold text-slate-800">
                        {formatCurrency(c.item.price * c.qty, false)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Oraliq jami</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Xizmat haqi</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>To'lov turi</span>
                    <span className="font-semibold text-slate-700">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                    <span>Jami:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="mt-4 w-full h-11 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-extrabold text-xs uppercase flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Chek chiqarish
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
