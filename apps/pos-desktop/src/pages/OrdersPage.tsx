import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, ChefHat, Armchair, Search } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../store/pos-store';
import type { PosOrder } from '../data/catalog';

const STATUS_META: Record<PosOrder['status'], { label: string; badge: string }> = {
  NEW: { label: 'Yangi', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  PREPARING: { label: 'Tayyorlanmoqda', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  READY: { label: 'Tayyor', badge: 'bg-teal-50 text-[#0F9D8A] border-teal-200' },
  PAID: { label: 'To\'langan', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Bekor qilingan', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function OrdersPage() {
  const { orders, updateOrderStatus, cancelOrder } = usePosStore();
  const [filter, setFilter] = useState<'ALL' | PosOrder['status']>('ALL');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<PosOrder | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const filtered = orders.filter((o) => {
    const matchStatus = filter === 'ALL' || o.status === filter;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.tableName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const res = await cancelOrder(cancelTarget.id, adminPin, cancelReason || 'Mijoz so\'rovi');
    if (!res.ok) {
      setCancelError(res.error || 'Xatolik');
      return;
    }
    setCancelTarget(null);
    setAdminPin('');
    setCancelReason('');
    setCancelError('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Buyurtmalar</h1>
            <p className="text-xs text-slate-500 mt-0.5">Faol va yakunlangan buyurtmalar ro'yxati</p>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buyurtma yoki stol qidirish..."
              className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F9D8A]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(
            [
              { id: 'ALL', label: `Barchasi (${orders.length})` },
              { id: 'NEW', label: 'Yangi' },
              { id: 'PREPARING', label: 'Tayyorlanmoqda' },
              { id: 'READY', label: 'Tayyor' },
              { id: 'PAID', label: 'To\'langan' },
              { id: 'CANCELLED', label: 'Bekor qilingan' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-[#0F9D8A] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#0F9D8A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order) => {
            const meta = STATUS_META[order.status];
            const time = new Date(order.createdAt).toLocaleTimeString('uz-UZ', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 font-mono">
                        #{order.orderNumber}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Armchair className="w-3.5 h-3.5 text-[#0F9D8A]" />
                          {order.tableName}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {time}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="py-3 space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium truncate pr-2">
                          {item.name} <span className="text-slate-400">x{item.quantity}</span>
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {formatCurrency(item.totalPrice, false)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Jami summa:</span>
                    <span className="text-base font-extrabold text-[#0F9D8A]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                    <div className="flex items-center gap-2">
                      {order.status === 'NEW' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="flex-1 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          Tayyorlanmoqda
                        </button>
                      )}
                      {(order.status === 'NEW' || order.status === 'PREPARING') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          className="flex-1 h-9 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tayyor
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PAID')}
                          className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          To'landi
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCancelTarget(order);
                          setCancelError('');
                        }}
                        className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center"
                        title="Buyurtmani bekor qilish"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin PIN Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">Buyurtmani bekor qilish</h3>
              <p className="text-xs text-slate-500 mt-1">
                #{cancelTarget.orderNumber} buyurtmasini bekor qilish uchun Admin PIN-kodini kiriting (standart: 1111).
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Admin PIN-kod</label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="****"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-bold tracking-widest focus:outline-none focus:border-[#0F9D8A]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sabab</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Masalan: Mijoz fikridan qaytdi"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0F9D8A]"
                />
              </div>
              {cancelError && <p className="text-xs font-semibold text-rose-600">{cancelError}</p>}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Yopish
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Bekor qilishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
