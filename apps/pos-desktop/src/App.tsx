import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { PosScreen } from './components/pos/PosScreen';
import { PaymentModal } from './components/pos/PaymentModal';
import { OrdersPage } from './pages/OrdersPage';
import { TablesPage } from './pages/TablesPage';
import { KitchenPage } from './pages/KitchenPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { SettingsPage } from './pages/SettingsPage';
import { usePosStore } from './store/pos-store';

export default function App() {
  const {
    activeTab,
    openPaymentModal,
    setPaymentModalOpen,
    clearCart,
    cart,
    checkConnectionAndSync,
    toastMessage,
    clearToast,
  } = usePosStore();

  // Keyboard shortcuts (F1 clear cart, F5 payment, Esc close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (cart.length > 0) {
          openPaymentModal('CASH');
        }
      } else if (e.key === 'Escape') {
        setPaymentModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, clearCart, openPaymentModal, setPaymentModalOpen]);

  // Online/offline listeners & 15-second background sync probe
  useEffect(() => {
    checkConnectionAndSync();
    const onOnline = () => checkConnectionAndSync();
    const onOffline = () => checkConnectionAndSync();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const interval = setInterval(() => {
      checkConnectionAndSync();
    }, 15000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, [checkConnectionAndSync]);

  const renderPage = () => {
    switch (activeTab) {
      case 'pos':
        return <PosScreen />;
      case 'orders':
        return <OrdersPage />;
      case 'tables':
        return <TablesPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PosScreen />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F4F6F8] text-slate-900 font-sans">
      <TopBar />
      {renderPage()}
      <PaymentModal />

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div
          onClick={clearToast}
          className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border cursor-pointer transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : toastMessage.type === 'info'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-[#0F9D8A] text-white border-[#0D8A79]'
          }`}
        >
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
