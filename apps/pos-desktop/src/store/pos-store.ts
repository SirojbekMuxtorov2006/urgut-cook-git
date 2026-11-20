import { create } from 'zustand';

export interface CartItem {
  itemId: string;
  name: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  modifiers?: { name: string; price: number }[];
  notes?: string;
}

interface PosState {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  selectedTable: { id: string; name: string } | null;
  guestCount: number;
  cart: CartItem[];
  discountPercent: number;
  discountAmount: number;
  serviceFeePercent: number;
  isPaymentModalOpen: boolean;
  syncStatus: 'ONLINE' | 'SYNCING' | 'OFFLINE';
  cashier: { id: string; name: string; role: string; discountLimit: number };

  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  setSelectedTable: (table: { id: string; name: string } | null) => void;
  setGuestCount: (count: number) => void;
  addToCart: (item: Omit<CartItem, 'totalPrice'>) => void;
  updateQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  setDiscount: (percent: number, amount: number) => void;
  setPaymentModalOpen: (open: boolean) => void;
  setSyncStatus: (status: 'ONLINE' | 'SYNCING' | 'OFFLINE') => void;

  getSubtotal: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  orderType: 'DINE_IN',
  selectedTable: { id: 'tbl-7', name: 'Stol #7' },
  guestCount: 2,
  cart: [
    { itemId: '1', name: 'Choyxona Oshi (1 porsiya)', unitPrice: 38000, quantity: 2, totalPrice: 76000 },
    { itemId: '2', name: 'Achchiq-chuchuk salati', unitPrice: 12000, quantity: 1, totalPrice: 12000 },
    { itemId: '3', name: 'Ko\'k Choy (choynak 1L)', unitPrice: 6000, quantity: 1, totalPrice: 6000 },
  ],
  discountPercent: 0,
  discountAmount: 0,
  serviceFeePercent: 10,
  isPaymentModalOpen: false,
  syncStatus: 'ONLINE',
  cashier: { id: 'c1', name: 'Dilshod Aliyev', role: 'Kassir #1', discountLimit: 10 },

  setOrderType: (type) => set({ orderType: type }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setGuestCount: (count) => set({ guestCount: count }),

  addToCart: (item) => {
    const current = get().cart;
    const existingIdx = current.findIndex(
      (c) => c.itemId === item.itemId && c.variantId === item.variantId,
    );

    if (existingIdx >= 0) {
      const updated = [...current];
      updated[existingIdx].quantity += item.quantity;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      set({ cart: updated });
    } else {
      const totalPrice = item.quantity * item.unitPrice;
      set({ cart: [...current, { ...item, totalPrice }] });
    }
  },

  updateQuantity: (index, delta) => {
    const current = [...get().cart];
    if (!current[index]) return;

    const newQty = current[index].quantity + delta;
    if (newQty <= 0) {
      current.splice(index, 1);
    } else {
      current[index].quantity = newQty;
      current[index].totalPrice = newQty * current[index].unitPrice;
    }
    set({ cart: current });
  },

  removeFromCart: (index) => {
    const current = [...get().cart];
    current.splice(index, 1);
    set({ cart: current });
  },

  clearCart: () => set({ cart: [], discountAmount: 0, discountPercent: 0 }),
  setDiscount: (percent, amount) => set({ discountPercent: percent, discountAmount: amount }),
  setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open }),
  setSyncStatus: (status) => set({ syncStatus: status }),

  getSubtotal: () => get().cart.reduce((sum, i) => sum + i.totalPrice, 0),
  getServiceFee: () => {
    if (get().orderType !== 'DINE_IN') return 0;
    return Math.round((get().getSubtotal() * get().serviceFeePercent) / 100);
  },
  getTotal: () => {
    const sub = get().getSubtotal();
    const fee = get().getServiceFee();
    const disc = get().discountAmount;
    return Math.max(0, sub + fee - disc);
  },
}));
