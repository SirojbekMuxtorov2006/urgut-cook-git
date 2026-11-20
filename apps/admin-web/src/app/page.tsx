'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  DollarSign,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@oshxona/shared';

interface SummaryData {
  totalSales: number;
  totalOrders: number;
  averageBill: number;
  netProfit: number;
  grossProfit: number;
  totalExpenses: number;
}

interface TopItem {
  name: string;
  categoryName: string;
  soldQuantity: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData>({
    totalSales: 4280000,
    totalOrders: 48,
    averageBill: 89166,
    netProfit: 1850000,
    grossProfit: 2150000,
    totalExpenses: 300000,
  });

  const [topItems, setTopItems] = useState<TopItem[]>([
    { name: 'Choyxona Oshi', categoryName: 'Ikkinchi taomlar', soldQuantity: 34, totalRevenue: 1292000 },
    { name: 'Kuskovoy Shashlik', categoryName: 'Shashliklar', soldQuantity: 28, totalRevenue: 616000 },
    { name: 'Qovurma Lag\'mon', categoryName: 'Ikkinchi taomlar', soldQuantity: 18, totalRevenue: 684000 },
    { name: 'Qo\'y go\'shtli Sho\'rva', categoryName: 'Birinchi taomlar', soldQuantity: 15, totalRevenue: 525000 },
    { name: 'Tandir Somsa', categoryName: 'Non va somsa', soldQuantity: 42, totalRevenue: 504000 },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Sarlavha */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bugungi Ko'rsatkichlar</h1>
          <p className="text-slate-500 text-sm mt-1">Rayhon Milliy Taomlari — Jonli savdo tahlili</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Kassalar: 2 ta faol
          </span>
          <span className="text-xs text-slate-500 font-medium">Yangilandi: Hozir</span>
        </div>
      </div>

      {/* 4 ta asosiy kartochka */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tushum */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bugungi Tushum</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{formatCurrency(summary.totalSales)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            ↑ +14% kechagiga nisbatan
          </p>
        </div>

        {/* Buyurtmalar soni */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Buyurtmalar Soni</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{summary.totalOrders} ta</p>
          <p className="text-xs text-slate-500 mt-1">Barcha kassalar bo'yicha</p>
        </div>

        {/* O'rtacha chek */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">O'rtacha Chek</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">{formatCurrency(summary.averageBill)}</p>
          <p className="text-xs text-slate-500 mt-1">1 ta buyurtmaga to'g'ri kelgan</p>
        </div>

        {/* Sof foyda */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sof Foyda</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-3">{formatCurrency(summary.netProfit)}</p>
          <p className="text-xs text-slate-500 mt-1">Tannarx va xarajatlar chiqarilgach</p>
        </div>
      </div>

      {/* 2 Ustunli bo'lim: Soatlik yuklama va TOP taomlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Soatlik yuklama jadvali */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Soatlik Mijozlar Oqimi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Bugungi kunlik faollik dinamikasi</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">Bugun</span>
          </div>

          <div className="h-64 flex items-end gap-3 pt-6 border-b border-slate-100">
            {[
              { h: '10:00', v: 15 },
              { h: '11:00', v: 35 },
              { h: '12:00', v: 95 },
              { h: '13:00', v: 100 },
              { h: '14:00', v: 70 },
              { h: '15:00', v: 25 },
              { h: '16:00', v: 20 },
              { h: '17:00', v: 40 },
              { h: '18:00', v: 85 },
              { h: '19:00', v: 90 },
              { h: '20:00', v: 60 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  style={{ height: `${bar.v}%` }}
                  className="w-full bg-orange-400 group-hover:bg-orange-500 rounded-t-md transition-all relative"
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded transition-opacity">
                    {bar.v}%
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">{bar.h}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Pik soatlar: Tushlik (12:00–14:00) va Kechki ovqat (18:00–20:00)</p>
        </div>

        {/* TOP-5 taomlar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Eng Ko'p Sotilgan Taomlar</h2>
            <p className="text-xs text-slate-500 mt-0.5">Bugungi TOP-5 reytingi</p>

            <div className="mt-5 space-y-4">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.categoryName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{item.soldQuantity} dona</p>
                    <p className="text-[11px] text-slate-400">{formatCurrency(item.totalRevenue, false)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <a href="/reports" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1">
              Barcha hisobotlarni ko'rish →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
