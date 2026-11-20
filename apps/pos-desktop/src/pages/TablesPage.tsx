import React, { useState } from 'react';
import { Armchair, Users, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { usePosStore } from '../store/pos-store';
import type { RestaurantTable } from '../data/catalog';

const TABLE_STYLES: Record<
  RestaurantTable['status'],
  { label: string; card: string; badge: string; dot: string }
> = {
  AVAILABLE: {
    label: 'Bo\'sh',
    card: 'border-emerald-200 hover:border-[#0F9D8A]',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'Band',
    card: 'border-rose-200 bg-rose-50/20 hover:border-rose-400',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  RESERVED: {
    label: 'Bron qilingan',
    card: 'border-amber-200 bg-amber-50/20 hover:border-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
};

export function TablesPage() {
  const { tables, updateTableStatus, setSelectedTable, setActiveTab } = usePosStore();
  const [selectedHall, setSelectedHall] = useState<string>('ALL');

  const halls = ['ALL', ...Array.from(new Set(tables.map((t) => t.hall)))];
  const filtered = selectedHall === 'ALL' ? tables : tables.filter((t) => t.hall === selectedHall);

  const counts = {
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
  };

  const openTableInPos = (table: RestaurantTable) => {
    setSelectedTable({ id: table.id, name: table.name });
    setActiveTab('pos');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header + Legend */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Stollar xaritasi</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Stolni tanlab kassada buyurtma oching yoki holatini yangilang
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Bo'sh: {counts.available}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Band: {counts.occupied}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Bron: {counts.reserved}
            </span>
          </div>
        </div>

        {/* Hall Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {halls.map((hall) => (
            <button
              key={hall}
              onClick={() => setSelectedHall(hall)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedHall === hall
                  ? 'bg-[#0F9D8A] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#0F9D8A]'
              }`}
            >
              {hall === 'ALL' ? 'Barcha zallar' : hall}
            </button>
          ))}
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((table) => {
            const style = TABLE_STYLES[table.status];
            return (
              <div
                key={table.id}
                className={`bg-white rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${style.card}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                        <Armchair className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{table.name}</h3>
                        <p className="text-[11px] text-slate-500">{table.hall}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${style.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {table.seats} o'rinli
                    </span>
                    {table.currentTotal ? (
                      <span className="font-bold text-slate-900">
                        {formatCurrency(table.currentTotal)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Buyurtma yo'q</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openTableInPos(table)}
                    className="w-full h-9 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Kassada ochish
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { status: 'AVAILABLE', label: 'Bo\'sh' },
                        { status: 'OCCUPIED', label: 'Band' },
                        { status: 'RESERVED', label: 'Bron' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.status}
                        onClick={() => updateTableStatus(table.id, opt.status)}
                        className={`h-8 rounded-lg text-[11px] font-semibold border transition-colors ${
                          table.status === opt.status
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
