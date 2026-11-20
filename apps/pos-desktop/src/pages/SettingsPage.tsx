import React, { useState } from 'react';
import { Store, Printer, CreditCard, Shield, RefreshCw, Save } from 'lucide-react';
import { usePosStore } from '../store/pos-store';

export function SettingsPage() {
  const { settings, updateSettings, syncStatus, pendingSyncCount, lastSyncedAt, checkConnectionAndSync } =
    usePosStore();
  const [form, setForm] = useState(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sozlamalar</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Restoran ma'lumotlari, chek, printer, to'lov usullari va sinxronizatsiya
            </p>
          </div>
          <button
            type="submit"
            className="h-10 px-5 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Saqlash
          </button>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Store className="w-4 h-4 text-[#0F9D8A]" />
            Restoran ma'lumotlari
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Restoran nomi</label>
              <input
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Telefon raqami</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-600 block mb-1">Manzil</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
          </div>
        </div>

        {/* Receipt & Printer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Printer className="w-4 h-4 text-[#0F9D8A]" />
            Chek va Printer sozlamalari
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Printer nomi</label>
              <input
                value={form.printerName}
                onChange={(e) => setForm({ ...form, printerName: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Chek qog'oz eni</label>
              <select
                value={form.printerWidth}
                onChange={(e) =>
                  setForm({ ...form, printerWidth: e.target.value as '58mm' | '80mm' })
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white"
              >
                <option value="80mm">80 mm (Standart)</option>
                <option value="58mm">58 mm (Ixcham)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Xizmat haqi (%)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={form.serviceFeePercent}
                onChange={(e) => setForm({ ...form, serviceFeePercent: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">QQS / Soliq (%)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={form.taxPercent}
                onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-600 block mb-1">Chek pastki matni</label>
              <input
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods & Offline Sync */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-[#0F9D8A]" />
              To'lov usullari
            </div>
            {(
              [
                { key: 'enableCash', label: 'Naqd pul' },
                { key: 'enableCard', label: 'Bank kartasi (Uzcard/Humo)' },
                { key: 'enableQr', label: 'QR to\'lov (Click/Payme)' },
                { key: 'enableMixed', label: 'Aralash to\'lov' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.key}
                className="flex items-center justify-between py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <span>{opt.label}</span>
                <input
                  type="checkbox"
                  checked={form[opt.key]}
                  onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })}
                  className="w-4 h-4 accent-[#0F9D8A]"
                />
              </label>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Shield className="w-4 h-4 text-[#0F9D8A]" />
              Lokal Server va Sinxronizatsiya
            </div>
            <div className="text-xs">
              <label className="font-semibold text-slate-600 block mb-1">Lokal API manzili</label>
              <input
                value={form.apiUrl}
                onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 font-mono text-[11px]"
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Holat:</span>
                <span className="font-bold text-slate-800">{syncStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Navbatdagi yozuvlar:</span>
                <span className="font-bold text-slate-800">{pendingSyncCount} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Oxirgi sinxron:</span>
                <span className="font-semibold text-slate-700">{lastSyncedAt || 'Hali yo\'q'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => checkConnectionAndSync()}
              className="w-full h-9 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#0F9D8A] text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Hozir sinxronlash
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
