import React, { useState } from 'react';
import { usePosStore } from '../store/pos-store';
import { formatCurrency } from '@oshxona/shared';
import { Search } from 'lucide-react';

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  hasVariants?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  // Ikkinchi taomlar (1)
  { id: '1', categoryId: '1', name: 'Choyxona Oshi (1 porsiya)', price: 38000, isAvailable: true },
  { id: '2', categoryId: '1', name: 'To\'y Oshi (maxsus mayizli)', price: 42000, isAvailable: true },
  { id: '3', categoryId: '1', name: 'Qovurma Lag\'mon', price: 38000, isAvailable: true },
  { id: '4', categoryId: '1', name: 'Cho\'zma Lag\'mon', price: 38000, isAvailable: true },
  { id: '5', categoryId: '1', name: 'Go\'shtli Manti (4 dona)', price: 36000, isAvailable: true },
  { id: '6', categoryId: '1', name: 'Qozon Kabob', price: 65000, isAvailable: true },
  { id: '7', categoryId: '1', name: 'Toshkentcha Norin', price: 48000, isAvailable: true },
  { id: '8', categoryId: '1', name: 'Jiz-biz (tovada)', price: 55000, isAvailable: true },

  // Birinchi taomlar (2)
  { id: '9', categoryId: '2', name: 'Qo\'y go\'shtli Sho\'rva', price: 35000, isAvailable: true },
  { id: '10', categoryId: '2', name: 'No\'xat Sho\'rva', price: 32000, isAvailable: true },
  { id: '11', categoryId: '2', name: 'Mastava', price: 30000, isAvailable: true },
  { id: '12', categoryId: '2', name: 'Sho\'rvali Chuchvara', price: 34000, isAvailable: true },

  // Shashliklar (3)
  { id: '13', categoryId: '3', name: 'Qiyma Shashlik', price: 16000, isAvailable: true },
  { id: '14', categoryId: '3', name: 'Kuskovoy Shashlik', price: 22000, isAvailable: true },
  { id: '15', categoryId: '3', name: 'Jigar Shashlik', price: 18000, isAvailable: true },
  { id: '16', categoryId: '3', name: 'Qovurg\'a Shashlik', price: 26000, isAvailable: true },

  // Salatlar (4)
  { id: '17', categoryId: '4', name: 'Achchiq-chuchuk salati', price: 12000, isAvailable: true },
  { id: '18', categoryId: '4', name: 'Bahor salati', price: 14000, isAvailable: true },
  { id: '19', categoryId: '4', name: 'Suzma ko\'kat bilan', price: 10000, isAvailable: true },
  { id: '20', categoryId: '4', name: 'Fransuzcha salat', price: 20000, isAvailable: true },

  // Non va somsa (5)
  { id: '21', categoryId: '5', name: 'Tandir Somsa', price: 12000, isAvailable: true },
  { id: '22', categoryId: '5', name: 'Qatlama Somsa', price: 10000, isAvailable: true },
  { id: '23', categoryId: '5', name: 'Tandir Non', price: 5000, isAvailable: true },
  { id: '24', categoryId: '5', name: 'Samarqandcha Patir Non', price: 12000, isAvailable: true },

  // Ichimliklar (6)
  { id: '25', categoryId: '6', name: 'Ko\'k Choy (choynak 1L)', price: 6000, isAvailable: true },
  { id: '26', categoryId: '6', name: 'Qora Choy (choynak 1L)', price: 6000, isAvailable: true },
  { id: '27', categoryId: '6', name: 'Limonli Asalli Choy', price: 14000, isAvailable: true },
  { id: '28', categoryId: '6', name: 'Uy Kompoti (grafin 1L)', price: 18000, isAvailable: true },
  { id: '29', categoryId: '6', name: 'Coca-Cola 1.5L', price: 16000, isAvailable: true },
];

interface Props {
  selectedCategoryId: string;
}

export function MenuGrid({ selectedCategoryId }: Props) {
  const [search, setSearch] = useState('');
  const addToCart = usePosStore((s) => s.addToCart);

  const filtered = MENU_ITEMS.filter((item) => {
    const matchesCat = item.categoryId === selectedCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-4 overflow-hidden">
      {/* Qidiruv F2 */}
      <div className="mb-3 relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Taom qidirish... (F2)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
        />
      </div>

      {/* Taomlar Grid (Katta 80px+ sensorli tugmalar) */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 overflow-y-auto pr-1">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() =>
              addToCart({
                itemId: item.id,
                name: item.name,
                unitPrice: item.price,
                quantity: 1,
              })
            }
            className="min-h-[96px] p-4 bg-slate-900 border border-slate-800 hover:border-orange-500/80 hover:bg-slate-850 rounded-2xl flex flex-col justify-between text-left transition-all active:scale-95 shadow-md group"
          >
            <p className="font-bold text-sm text-slate-100 group-hover:text-white leading-snug line-clamp-2">
              {item.name}
            </p>
            <p className="font-extrabold text-orange-400 text-base mt-2">
              {formatCurrency(item.price)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
