import React, { useState } from 'react';
import { User, Plus, ShieldCheck, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { usePosStore } from '../store/pos-store';
import type { Employee } from '../data/catalog';

export function EmployeesPage() {
  const { employees, toggleEmployeeActive, addEmployee } = usePosStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    username: string;
    role: Employee['role'];
    branch: string;
    pinCode: string;
  }>({
    name: '',
    username: '',
    role: 'CASHIER',
    branch: 'Asosiy filial (Chilonzor)',
    pinCode: '4444',
  });

  const ROLE_LABELS: Record<Employee['role'], string> = {
    ADMIN: 'Administrator',
    CASHIER: 'Kassir',
    WAITER: 'Ofitsiant',
    CHEF: 'Oshpaz',
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addEmployee({
      name: form.name.trim(),
      username: form.username.trim() || form.name.toLowerCase().replace(/\s+/g, ''),
      role: form.role,
      roleLabel: ROLE_LABELS[form.role],
      branch: form.branch,
      pinCode: form.pinCode || '0000',
      discountLimit: form.role === 'ADMIN' ? 100 : form.role === 'CASHIER' ? 10 : 0,
      isActive: true,
    });
    setShowAdd(false);
    setForm({ name: '', username: '', role: 'CASHIER', branch: 'Asosiy filial (Chilonzor)', pinCode: '4444' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8]">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Xodimlar</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kassirlar, ofitsiantlar, oshpazlar va filial biriktiruvi</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="h-10 px-4 rounded-xl bg-[#0F9D8A] hover:bg-[#0D8A79] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Yangi xodim
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                    <p className="text-xs text-[#0F9D8A] font-semibold">{emp.roleLabel}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleEmployeeActive(emp.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    emp.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {emp.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Faol
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Nofaol
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Building2 className="w-3.5 h-3.5" /> Filial
                  </span>
                  <span className="font-semibold text-slate-800">{emp.branch}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Chegirma limiti
                  </span>
                  <span className="font-semibold text-slate-800">{emp.discountLimit}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-3 shadow-xl text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">Yangi xodim qo'shish</h3>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ism-familiya</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
                placeholder="Masalan: Jasur Toshmatov"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lavozimi</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Employee['role'] })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CASHIER">Kassir</option>
                  <option value="WAITER">Ofitsiant</option>
                  <option value="CHEF">Oshpaz</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">PIN-kod (4 raqam)</label>
                <input
                  maxLength={4}
                  value={form.pinCode}
                  onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Filial</label>
              <input
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 h-9 rounded-xl bg-[#0F9D8A] text-white font-bold"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
