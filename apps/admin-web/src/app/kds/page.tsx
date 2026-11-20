'use client';

import { useState, useEffect } from 'react';
import { Clock, ChefHat, Check, Flame, RefreshCw } from 'lucide-react';

interface KitchenTicket {
  orderId: string;
  orderNumber: string;
  tableName: string;
  waiterName: string;
  createdAt: string;
  elapsedMinutes: number;
  isDelayed: boolean;
  items: {
    id: string;
    name: string;
    variantName?: string;
    quantity: number;
    selectedModifiers?: any[];
    notes?: string;
    status: 'PENDING' | 'COOKING' | 'READY';
    station: string;
  }[];
}

export default function KdsPage() {
  const [station, setStation] = useState<string>('ALL');
  const [tickets, setTickets] = useState<KitchenTicket[]>([
    {
      orderId: '1',
      orderNumber: 'K1-1120-0012',
      tableName: 'Asosiy Zal - Stol #7',
      waiterName: 'Sirojbek',
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      elapsedMinutes: 18,
      isDelayed: true,
      items: [
        { id: '101', name: 'Choyxona Oshi (1 porsiya)', quantity: 2, status: 'COOKING', station: 'KITCHEN_HOT', selectedModifiers: [{ name: '+ Qazi' }] },
        { id: '102', name: 'Achchiq-chuchuk salati', quantity: 1, status: 'READY', station: 'KITCHEN_COLD' },
      ],
    },
    {
      orderId: '2',
      orderNumber: 'K1-1120-0013',
      tableName: 'VIP Xona #2',
      waiterName: 'Dilshod',
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      elapsedMinutes: 6,
      isDelayed: false,
      items: [
        { id: '103', name: 'Qozon Kabob', quantity: 2, status: 'COOKING', station: 'KITCHEN_HOT', notes: 'Piyozsiz bo\'lsin' },
        { id: '104', name: 'Kuskovoy Shashlik', quantity: 4, status: 'COOKING', station: 'KITCHEN_HOT' },
      ],
    },
    {
      orderId: '3',
      orderNumber: 'K1-1120-0014',
      tableName: 'Olib ketish',
      waiterName: 'Kassa',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      elapsedMinutes: 2,
      isDelayed: false,
      items: [
        { id: '105', name: 'Qovurma Lag\'mon', quantity: 1, status: 'COOKING', station: 'KITCHEN_HOT' },
        { id: '106', name: 'Tandir Somsa', quantity: 5, status: 'READY', station: 'KITCHEN_HOT' },
      ],
    },
  ]);

  const toggleItemReady = (orderId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((order) => {
        if (order.orderId !== orderId) return order;
        return {
          ...order,
          items: order.items.map((i) =>
            i.id === itemId
              ? { ...i, status: i.status === 'READY' ? 'COOKING' : 'READY' }
              : i,
          ),
        };
      }),
    );
  };

  const markOrderReady = (orderId: string) => {
    setTickets((prev) => prev.filter((o) => o.orderId !== orderId));
  };

  const filteredTickets = tickets.filter((t) => {
    if (station === 'ALL') return true;
    return t.items.some((i) => i.station === station);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 -m-8">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/30">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">KDS — Oshxona Ekrani</h1>
            <p className="text-xs text-slate-400">Buyurtmalar navbati va tayyorlash jarayoni</p>
          </div>
        </div>

        {/* Sexlar filtri */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'ALL', label: 'Barcha Sexlar' },
            { id: 'KITCHEN_HOT', label: 'Issiq Sex' },
            { id: 'KITCHEN_COLD', label: 'Salat Sex' },
            { id: 'BAR', label: 'Bar' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStation(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                station === s.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chiptalar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.orderId}
            className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
              ticket.isDelayed
                ? 'bg-rose-950/40 border-rose-600/60 ring-2 ring-rose-500/30'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            {/* Chipta tepasi */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                ticket.isDelayed ? 'bg-rose-900/40 border-rose-800/40' : 'bg-slate-800/50 border-slate-800'
              }`}
            >
              <div>
                <h3 className="font-bold text-base text-white">{ticket.tableName}</h3>
                <p className="text-xs text-slate-400">
                  {ticket.orderNumber} • {ticket.waiterName}
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  ticket.isDelayed ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-700 text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {ticket.elapsedMinutes} daq
              </div>
            </div>

            {/* Taomlar ro'yxati */}
            <div className="p-4 space-y-3 flex-1">
              {ticket.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItemReady(ticket.orderId, item.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    item.status === 'READY'
                      ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200 line-through opacity-70'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <span className="text-base font-bold text-orange-400">x{item.quantity}</span>
                  </div>

                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="mt-1 text-xs text-amber-300">
                      {item.selectedModifiers.map((m: any, idx: number) => (
                        <span key={idx} className="mr-2">+ {m.name}</span>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-rose-300 font-medium mt-1 bg-rose-950/60 px-2 py-0.5 rounded">
                      ⚠️ {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Chipta pastki tugmasi */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <button
                onClick={() => markOrderReady(ticket.orderId)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                Tayyor (Chiqarish)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
