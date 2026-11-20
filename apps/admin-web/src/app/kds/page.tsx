'use client';

import { useState } from 'react';
import { Clock, ChefHat, Check } from 'lucide-react';

interface KitchenTicket {
  orderId: string;
  orderNumber: string;
  tableName: string;
  waiterName: string;
  elapsedMinutes: number;
  isDelayed: boolean;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes?: string;
    status: 'NEW' | 'COOKING' | 'READY';
    station: string;
  }[];
}

export default function KdsPage() {
  const [station, setStation] = useState<string>('ALL');
  const [tickets, setTickets] = useState<KitchenTicket[]>([
    {
      orderId: '1',
      orderNumber: 'K1-1120-0012',
      tableName: 'Stol #7',
      waiterName: 'Sirojbek',
      elapsedMinutes: 18,
      isDelayed: true,
      items: [
        { id: '101', name: 'Choyxona Oshi', quantity: 2, status: 'COOKING', station: 'KITCHEN_HOT' },
        { id: '102', name: 'Achchiq-chuchuk', quantity: 1, status: 'READY', station: 'KITCHEN_COLD' },
      ],
    },
    {
      orderId: '2',
      orderNumber: 'K1-1120-0013',
      tableName: 'VIP #2',
      waiterName: 'Dilshod',
      elapsedMinutes: 6,
      isDelayed: false,
      items: [
        { id: '103', name: 'Qozon Kabob', quantity: 2, status: 'NEW', station: 'KITCHEN_HOT', notes: 'Piyozsiz bo\'lsin' },
        { id: '104', name: 'Kuskovoy Shashlik', quantity: 4, status: 'COOKING', station: 'KITCHEN_HOT' },
      ],
    },
    {
      orderId: '3',
      orderNumber: 'K1-1120-0014',
      tableName: 'Olib ketish',
      waiterName: 'Kassa',
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
            i.id === itemId ? { ...i, status: i.status === 'READY' ? 'COOKING' : 'READY' } : i,
          ),
        };
      }),
    );
  };

  const markOrderReady = (orderId: string) => {
    setTickets((prev) => prev.filter((o) => o.orderId !== orderId));
  };

  const filteredTickets = tickets.filter((t) =>
    station === 'ALL' ? true : t.items.some((i) => i.station === station),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F9D8A] text-white flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Oshxona ekrani (KDS)</h1>
            <p className="text-xs text-slate-500">Yangi va tayyorlanayotgan buyurtmalar navbati</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
          {[
            { id: 'ALL', label: 'Barcha sexlar' },
            { id: 'KITCHEN_HOT', label: 'Issiq sex' },
            { id: 'KITCHEN_COLD', label: 'Salat sex' },
            { id: 'BAR', label: 'Bar' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStation(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                station === s.id ? 'bg-[#0F9D8A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.orderId}
            className={`bg-white rounded-2xl border flex flex-col justify-between overflow-hidden shadow-sm ${
              ticket.isDelayed ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
            }`}
          >
            <div
              className={`p-4 border-b flex items-center justify-between ${
                ticket.isDelayed ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <h3 className="font-bold text-base text-slate-900">{ticket.tableName}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{ticket.orderNumber} • {ticket.waiterName}
                </p>
              </div>
              <span
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  ticket.isDelayed ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {ticket.elapsedMinutes} daq
              </span>
            </div>

            <div className="p-4 space-y-2.5 flex-1">
              {ticket.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItemReady(ticket.orderId, item.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    item.status === 'READY'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 line-through'
                      : 'bg-white border-slate-200 hover:border-[#0F9D8A] text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <span className="text-base font-extrabold text-[#0F9D8A]">x{item.quantity}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-rose-600 font-medium mt-1">Izoh: {item.notes}</p>
                  )}
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => markOrderReady(ticket.orderId)}
                className="w-full h-11 bg-[#0F9D8A] hover:bg-[#0D8A79] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
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
