import React, { useState, useEffect } from 'react';
import { usePosStore } from '../store/pos-store';
import { Store, User, Clock, Wifi, WifiOff, RefreshCw, Plus } from 'lucide-react';

export function Header() {
  const { selectedTable, orderType, setOrderType, syncStatus, cashier, clearCart } = usePosStore();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
      {/* Chap: Logo va Stol tanlovi */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-lg">
            O
          </div>
          <span className="font-bold text-lg text-white">OshxonaPOS</span>
        </div>

        {/* Buyurtma turi tanlash */}
        <div className="flex bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'DINE_IN', label: `Zal (${selectedTable ? selectedTable.name : 'Stol tanlanmagan'})` },
            { id: 'TAKEAWAY', label: 'Olib ketish' },
            { id: 'DELIVERY', label: 'Yetkazib berish' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setOrderType(t.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                orderType === t.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* O'ng: Kassir, Status indikatori, Soat va Yangi buyurtma */}
      <div className="flex items-center gap-5">
        {/* Yangi buyurtma F1 */}
        <button
          onClick={clearCart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          title="F1 — Yangi buyurtma"
        >
          <Plus className="w-4 h-4 text-orange-400" />
          Yangi Buyurtma (F1)
        </button>

        {/* Status Indikatori */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          {syncStatus === 'ONLINE' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-400">Online</span>
            </>
          ) : syncStatus === 'SYNCING' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-xs font-semibold text-amber-400">Sinxron...</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-semibold text-rose-400">Offline</span>
            </>
          )}
        </div>

        {/* Kassir */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-200 leading-tight">{cashier.name}</p>
            <p className="text-[10px] text-slate-400">{cashier.role}</p>
          </div>
        </div>

        {/* Soat */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          {time}
        </div>
      </div>
    </header>
  );
}
