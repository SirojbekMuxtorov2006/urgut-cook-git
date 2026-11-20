import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { MenuGrid } from './components/MenuGrid';
import { Cart } from './components/Cart';
import { PaymentModal } from './components/PaymentModal';
import { usePosStore } from './store/pos-store';

export default function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState('1');
  const { setPaymentModalOpen, clearCart, cart } = usePosStore();

  // Klaviatura hotkeylari (F1-F9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        setPaymentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, clearCart, setPaymentModalOpen]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Yuqori panel */}
      <Header />

      {/* Asosiy ish maydoni */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chap: Kategoriyalar */}
        <CategoryNav
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* O'rtada: Taomlar plitkasi */}
        <MenuGrid selectedCategoryId={selectedCategoryId} />

        {/* O'ngda: Savat va To'lov */}
        <Cart />
      </div>

      {/* To'lov Modali (Numpad) */}
      <PaymentModal />
    </div>
  );
}
