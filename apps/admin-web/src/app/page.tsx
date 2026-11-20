'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Banknote,
  CreditCard,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';
import { fetchApi } from '../lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    totalSales: 4280000,
    totalOrders: 48,
    cashSales: 2450000,
    cardSales: 1650000,
  });

  useEffect(() => {
    fetchApi<{ totalSales?: number; totalOrders?: number }>('/reports/sales')
      .then((data) => {
        if (data && typeof data.totalSales === 'number') {
          setSummary((prev) => ({
            ...prev,
            totalSales: data.totalSales ?? prev.totalSales,
            totalOrders: data.totalOrders ?? prev.totalOrders,
          }));
        }
      })
      .catch(() => {
        // Offline / local fallback
      });
  }, []);

  const recentOrders = [
    { number: 'K1-1120-0014', table: 'Stol #7', time: '14:22', status: 'Tayyorlanmoqda', total: 103400 },
    { number: 'K1-1120-0013', table: 'VIP #2', time: '14:15', status: 'Yangi', total: 253000 },
    { number: 'K1-1120-0012', table: 'Stol #6', time: '14:04', status: 'Tayyor', total: 182600 },
    { number: 'K1-1120-0011', table: 'Olib ketish', time: '13:45', status: 'To\'langan', total: 88000 },
    { number: 'K1-1120-0010', table: 'Stol #2', time: '13:20', status: 'To\'langan', total: 116550 },
  ];

  const hourlyBars = [
    { h: '10:00', v: 18 },
    { h: '11:00', v: 38 },
    { h: '12:00', v: 92 },
    { h: '13:00', v: 100 },
    { h: '14:00', v: 72 },
    { h: '15:00', v: 30 },
    { h: '16:00', v: 24 },
    { h: '17:00', v: 44 },
    { h: '18:00', v: 82 },
    { h: '19:00', v: 90 },
    { h: '20:00', v: 64 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bugungi ko'rsatkichlar</h1>
          <p className="text-xs text-slate-500 mt-0.5">Rayhon Milliy Taomlari — kunlik savdo holati</p>
        </div>
        <Link
          href="/pos"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold transition-colors"
        >
          Kassani ochish
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bugungi tushum</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#0F9D8A]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{formatCurrency(summary.totalSales)}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">+14% kechagiga nisbatan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Buyurtmalar soni</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{summary.totalOrders} ta</p>
          <p className="text-xs text-slate-500 mt-1">Barcha kassalar bo'yicha</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Naqd pul to'lovlari</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{formatCurrency(summary.cashSales)}</p>
          <p className="text-xs text-slate-500 mt-1">Kassadagi naqd tushum</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Karta va QR to'lovlar</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#0F9D8A]">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{formatCurrency(summary.cardSales)}</p>
          <p className="text-xs text-slate-500 mt-1">Uzcard, Humo, Click, Payme</p>
        </div>
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Soatlik savdo grafigi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Bugungi kunlik faollik dinamikasi</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-[#0F9D8A] rounded-lg">
              Bugun
            </span>
          </div>

          <div className="h-56 flex items-end gap-3 pt-4 border-b border-slate-100">
            {hourlyBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  style={{ height: `${bar.v}%` }}
                  className="w-full bg-[#0F9D8A]/85 hover:bg-[#0F9D8A] rounded-t-lg transition-colors"
                />
                <span className="text-[10px] font-medium text-slate-400">{bar.h}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">So'nggi buyurtmalar</h2>
              <Link href="/orders" className="text-xs font-bold text-[#0F9D8A] hover:underline">
                Barchasi
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.map((ord) => (
                <div
                  key={ord.number}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 font-mono">#{ord.number}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span>{ord.table}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{ord.time}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-900">{formatCurrency(ord.total)}</p>
                    <p className="text-[10px] font-semibold text-[#0F9D8A]">{ord.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
