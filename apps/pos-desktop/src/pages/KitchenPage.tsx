import React, { useState } from 'react';
import { ChefHat, Clock, Check, Flame } from 'lucide-react';
import { usePosStore } from '../store/pos-store';

export function KitchenPage() {
  const { orders, toggleKdsItemStatus, markKdsOrderReady } = usePosStore();
  const [station, setStation] = useState<'ALL' | 'KITCHEN_HOT' | 'KITCHEN_COLD' | 'BAR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'NEW' | 'PREPARING' | 'READY'>('ACTIVE');

  const kitchenOrders = orders.filter((o) => {
    if (o.status === 'CANCELLED' || o.status === 'PAID') return false;
    if (statusFilter !== 'ACTIVE' && o.status !== statusFilter) return false;
    if (station === 'ALL') return true;
    return o.items.some((i) => i.station === station);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F9D8A] text-white flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Oshxona ekrani (KDS)</h1>
              <p className="text-xs text-slate-500">Yangi, tayyorlanayotgan va tayyor buyurtmalar</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status tabs */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              {(
                [
                  { id: 'ACTIVE', label: 'Barchasi' },
                  { id: 'NEW', label: 'Yangi' },
                  { id: 'PREPARING', label: 'Tayyorlanmoqda' },
                  { id: 'READY', label: 'Tayyor' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === t.id ? 'bg-[#0F9D8A] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Station filter */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200">
              {(
                [
                  { id: 'ALL', label: 'Hamma sex' },
                  { id: 'KITCHEN_HOT', label: 'Issiq sex' },
                  { id: 'KITCHEN_COLD', label: 'Salat' },
                  { id: 'BAR', label: 'Bar' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStation(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    station === s.id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Kitchen Order Cards */}
        {kitchenOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Faol oshxona buyurtmalari yo'q</p>
            <p className="text-xs text-slate-500 mt-1">
              Kassadan yangi buyurtma yuborilganda shu yerda ko'rinadi
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kitchenOrders.map((order) => {
              const elapsedMin = Math.max(
                1,
                Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000),
              );
              const isDelayed = elapsedMin >= 15 && order.status !== 'READY';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border overflow-hidden flex flex-col justify-between shadow-sm ${
                    isDelayed ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`px-4 py-3.5 border-b flex items-center justify-between ${
                      isDelayed
                        ? 'bg-rose-50 border-rose-200'
                        : order.status === 'READY'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{order.tableName}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        #{order.orderNumber} • {order.cashierName}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        isDelayed
                          ? 'bg-rose-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {elapsedMin} daq
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-2.5 flex-1">
                    {order.items
                      .filter((i) => station === 'ALL' || i.station === station)
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleKdsItemStatus(order.id, item.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                            item.kitchenStatus === 'READY'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 line-through'
                              : item.kitchenStatus === 'PREPARING'
                                ? 'bg-amber-50/70 border-amber-200 text-slate-900'
                                : 'bg-white border-slate-200 hover:border-[#0F9D8A] text-slate-900'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{item.name}</p>
                            {item.notes && (
                              <p className="text-xs text-rose-600 font-semibold mt-0.5">
                                Izoh: {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-extrabold text-[#0F9D8A]">
                              x{item.quantity}
                            </span>
                            {item.kitchenStatus === 'PREPARING' && (
                              <Flame className="w-4 h-4 text-amber-500" />
                            )}
                            {item.kitchenStatus === 'READY' && (
                              <Check className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                        </button>
                      ))}
                  </div>

                  {/* Action Button */}
                  <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
                    <button
                      onClick={() => markKdsOrderReady(order.id)}
                      className="w-full h-11 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      {order.status === 'READY' ? 'Tayyor (Chiqarildi)' : 'Tayyor deb belgilash'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
