import React, { useState } from 'react';
import {
  ShoppingCart,
  ClipboardList,
  Armchair,
  ChefHat,
  UtensilsCrossed,
  Package,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  Leaf,
  AlertCircle,
} from 'lucide-react';
import { NavTab, usePosStore } from '../store/pos-store';

export const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pos', label: 'Kassa', icon: ShoppingCart },
  { id: 'orders', label: 'Buyurtmalar', icon: ClipboardList },
  { id: 'tables', label: 'Stollar', icon: Armchair },
  { id: 'kitchen', label: 'Oshxona', icon: ChefHat },
  { id: 'products', label: 'Mahsulotlar', icon: UtensilsCrossed },
  { id: 'inventory', label: 'Ombor', icon: Package },
  { id: 'reports', label: 'Hisobotlar', icon: BarChart3 },
  { id: 'employees', label: 'Xodimlar', icon: Users },
  { id: 'settings', label: 'Sozlamalar', icon: Settings },
];

export function TopBar() {
  const {
    activeTab,
    setActiveTab,
    cart,
    cashier,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    syncError,
    checkConnectionAndSync,
  } = usePosStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Brand logo matching reference image */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F9D8A] flex items-center justify-center text-white">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="text-left leading-none">
              <span className="font-extrabold text-lg tracking-tight text-slate-800">POS</span>
              <span className="hidden sm:inline-block ml-1.5 text-[11px] font-medium text-slate-400">
                Oshxona
              </span>
            </div>
          </button>
        </div>

        {/* Center: Clean horizontal navigation on tablet & desktop */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 justify-center min-w-0 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#0F9D8A] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Sync Status + Reference icons (Menu, Cart, User, Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Online / Offline / Sync indicator */}
          <button
            onClick={() => checkConnectionAndSync()}
            title={
              syncError
                ? `Sinxron xatoligi: ${syncError}`
                : lastSyncedAt
                  ? `Oxirgi sinxron: ${lastSyncedAt}`
                  : 'Sinxronizatsiyani tekshirish'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              syncStatus === 'ONLINE'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : syncStatus === 'SYNCING'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {syncStatus === 'ONLINE' ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : syncStatus === 'SYNCING' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {syncStatus === 'ONLINE'
                ? 'Online'
                : syncStatus === 'SYNCING'
                  ? 'Sinxron...'
                  : 'Offline'}
            </span>
            {pendingSyncCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingSyncCount}
              </span>
            )}
            {syncError && syncStatus === 'ONLINE' && (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </button>

          {lastSyncedAt && (
            <span className="hidden 2xl:inline text-[11px] text-slate-400">
              {lastSyncedAt}
            </span>
          )}

          {/* Drawer menu button (mobile / narrow screens) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Cart shortcut icon (teal like reference image) */}
          <button
            onClick={() => setActiveTab('pos')}
            className="relative w-9 h-9 rounded-lg text-[#0F9D8A] hover:bg-teal-50 flex items-center justify-center transition-colors"
            title="Kassa savati"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0F9D8A] text-white text-[10px] font-bold flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Cashier profile */}
          <button
            onClick={() => setActiveTab('employees')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            title={`${cashier.name} (${cashier.role})`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden md:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
              {cashier.name.split(' ')[0]}
            </span>
          </button>

          {/* Settings icon */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              activeTab === 'settings'
                ? 'bg-teal-50 text-[#0F9D8A]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            title="Sozlamalar"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Slide-over Navigation Drawer for tablets & smaller desktops */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/30"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F9D8A] flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base text-slate-800">OshxonaPOS</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0F9D8A] text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">{cashier.name}</p>
              <p>{cashier.role}</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
