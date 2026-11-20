import React from 'react';
import {
  Soup,
  Utensils,
  Flame,
  Salad,
  Cookie,
  Coffee,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: '1', name: 'Ikkinchi taomlar', icon: Utensils, color: 'bg-amber-500' },
  { id: '2', name: 'Birinchi taomlar', icon: Soup, color: 'bg-orange-500' },
  { id: '3', name: 'Shashlik va kaboblar', icon: Flame, color: 'bg-rose-500' },
  { id: '4', name: 'Salatlar va gazaklar', icon: Salad, color: 'bg-emerald-500' },
  { id: '5', name: 'Non va somsa', icon: Cookie, color: 'bg-amber-600' },
  { id: '6', name: 'Ichimliklar va choylar', icon: Coffee, color: 'bg-cyan-500' },
];

interface Props {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({ selectedCategoryId, onSelectCategory }: Props) {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 p-3 space-y-2 overflow-y-auto">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategoryId === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`w-full min-h-[64px] px-3.5 py-3 rounded-2xl flex items-center gap-3 text-left font-bold text-sm transition-all active:scale-95 ${
              isSelected
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-white/20 text-white' : `${cat.color} text-white`
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="leading-snug">{cat.name}</span>
          </button>
        );
      })}
    </aside>
  );
}
