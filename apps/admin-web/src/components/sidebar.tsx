'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  UtensilsCrossed,
  Package,
  BookOpen,
  RefreshCw,
  Store,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Boshqaruv (Dashboard)', href: '/', icon: LayoutDashboard },
  { label: 'Hisobotlar va Tahlil', href: '/reports', icon: BarChart3 },
  { label: 'Menyu va Narxlar', href: '/menu', icon: UtensilsCrossed },
  { label: 'Ombor va Xomashyo', href: '/stock', icon: Package },
  { label: 'Nasiya Daftari', href: '/debts', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-white">OshxonaPOS</h1>
          <span className="text-xs text-orange-400 font-medium">Boshqaruv Paneli</span>
        </div>
      </div>

      {/* Navigatsiya */}
      <nav className="flex-1 p-4 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Tizim va Sinxronizatsiya Holati */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-xs">
              <p className="font-semibold text-slate-200">Sinxron: Online</p>
              <p className="text-slate-400 text-[10px]">Bulut bilan bog'langan</p>
            </div>
          </div>
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </aside>
  );
}
