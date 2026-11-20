'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  LayoutDashboard,
  Leaf,
  Wifi,
  WifiOff,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Kassa', href: '/pos', icon: ShoppingCart },
  { label: 'Boshqaruv', href: '/', icon: LayoutDashboard },
  { label: 'Buyurtmalar', href: '/orders', icon: ClipboardList },
  { label: 'Stollar', href: '/tables', icon: Armchair },
  { label: 'Oshxona', href: '/kds', icon: ChefHat },
  { label: 'Mahsulotlar', href: '/menu', icon: UtensilsCrossed },
  { label: 'Ombor', href: '/stock', icon: Package },
  { label: 'Hisobotlar', href: '/reports', icon: BarChart3 },
  { label: 'Xodimlar', href: '/employees', icon: Users },
  { label: 'Sozlamalar', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const navContent = (
    <>
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-[#0F9D8A] flex items-center justify-center text-white">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-base text-slate-900">OshxonaPOS</span>
            <p className="text-[10px] font-medium text-slate-400">Admin Panel</p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#0F9D8A] text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
            isOnline
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4 shrink-0" /> : <WifiOff className="w-4 h-4 shrink-0" />}
          <div className="min-w-0">
            <p className="font-bold leading-tight">{isOnline ? 'Online rejim' : 'Offline rejim'}</p>
            <p className="text-[10px] opacity-80 truncate">
              {isOnline ? 'Server bilan bog\'langan' : 'Lokal kesh faol'}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0F9D8A] flex items-center justify-center text-white">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base text-slate-900">OshxonaPOS</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-slate-200 flex-col shrink-0 min-h-screen sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
