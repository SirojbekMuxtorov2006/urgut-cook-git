'use client';

import { useState } from 'react';
import { Store, Printer, CreditCard, Save } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState('Rayhon Milliy Taomlari');
  const [phone, setPhone] = useState('+998 71 200 45 45');
  const [address, setAddress] = useState('Toshkent sh., Chilonzor tumani, Bunyodkor 15');
  const [printer, setPrinter] = useState('XP-80C Termal Printer (80mm)');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sozlamalar</h1>
          <p className="text-xs text-slate-500 mt-0.5">Restoran, chek, printer va to'lov sozlamalari</p>
        </div>
        <button
          type="submit"
          className="h-10 px-5 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          Saqlash
        </button>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          Sozlamalar muvaffaqiyatli saqlandi!
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
          <Store className="w-4 h-4 text-[#0F9D8A]" /> Restoran ma'lumotlari
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Nomi</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200" />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-600 block mb-1">Manzil</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Printer className="w-4 h-4 text-[#0F9D8A]" /> Printer
          </div>
          <input value={printer} onChange={(e) => setPrinter(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <CreditCard className="w-4 h-4 text-[#0F9D8A]" /> To'lov usullari
          </div>
          {['Naqd pul', 'Bank kartasi', 'Click / Payme QR', 'Aralash to\'lov'].map((m) => (
            <label key={m} className="flex items-center justify-between font-semibold text-slate-700">
              <span>{m}</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0F9D8A]" />
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
