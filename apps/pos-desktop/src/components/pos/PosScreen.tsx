import React, { useState } from 'react';
import { UtensilsCrossed, ShoppingCart as CartIcon, Receipt } from 'lucide-react';
import { ProductGrid } from './ProductGrid';
import { ShoppingCart } from './ShoppingCart';
import { ReceiptPreview } from './ReceiptPreview';
import { usePosStore } from '../../store/pos-store';

export function PosScreen() {
  const [mobilePanel, setMobilePanel] = useState<'products' | 'cart' | 'receipt'>('products');
  const cartCount = usePosStore((s) => s.cart.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3 bg-[#F4F6F8]">
      {/* Responsive Panel Switcher for narrower tablets / screens (< lg) */}
      <div className="flex lg:hidden bg-white p-1 rounded-xl border border-slate-200 shrink-0">
        {[
          { id: 'products' as const, label: 'Mahsulotlar', icon: UtensilsCrossed },
          { id: 'cart' as const, label: `Savat (${cartCount})`, icon: CartIcon },
          { id: 'receipt' as const, label: 'Chek', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = mobilePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMobilePanel(tab.id)}
              className={`flex-1 h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                active ? 'bg-[#0F9D8A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Three-Column Desktop/Tablet POS Layout: ~42% Products | ~33% Cart | ~25% Receipt */}
      <div className="flex-1 flex gap-3.5 overflow-hidden min-h-0">
        <div
          className={`${
            mobilePanel === 'products' ? 'flex' : 'hidden'
          } lg:flex flex-col w-full lg:w-[42%] h-full min-w-0`}
        >
          <ProductGrid />
        </div>

        <div
          className={`${
            mobilePanel === 'cart' ? 'flex' : 'hidden'
          } lg:flex flex-col w-full lg:w-[33%] h-full min-w-0`}
        >
          <ShoppingCart />
        </div>

        <div
          className={`${
            mobilePanel === 'receipt' ? 'flex' : 'hidden'
          } lg:flex flex-col w-full lg:w-[25%] h-full min-w-0`}
        >
          <ReceiptPreview />
        </div>
      </div>
    </div>
  );
}
