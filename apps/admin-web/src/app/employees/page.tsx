'use client';

import { useState } from 'react';
import { User, Building2, CheckCircle2, XCircle } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([
    { id: '1', name: 'Sardor Rahimov', role: 'Administrator', branch: 'Asosiy filial (Chilonzor)', active: true },
    { id: '2', name: 'Dilshod Aliyev', role: 'Kassir #1', branch: 'Asosiy filial (Chilonzor)', active: true },
    { id: '3', name: 'Madina Karimova', role: 'Kassir #2', branch: 'Asosiy filial (Chilonzor)', active: true },
    { id: '4', name: 'Sirojbek Usmonov', role: 'Ofitsiant', branch: 'Asosiy filial (Chilonzor)', active: true },
    { id: '5', name: 'Bahrom Tursunov', role: 'Bosh oshpaz', branch: 'Asosiy filial (Chilonzor)', active: true },
  ]);

  const toggle = (id: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e)));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Xodimlar</h1>
        <p className="text-xs text-slate-500 mt-0.5">Xodimlar ro'yxati, lavozimi va faollik holati</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F9D8A] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                  <p className="text-xs font-semibold text-[#0F9D8A]">{emp.role}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(emp.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  emp.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {emp.active ? <><CheckCircle2 className="w-3 h-3" /> Faol</> : <><XCircle className="w-3 h-3" /> Nofaol</>}
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Filial</span>
              <span className="font-semibold text-slate-800">{emp.branch}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
