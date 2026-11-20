import { create } from 'zustand';
import {
  Category,
  CashMovement,
  Employee,
  INITIAL_CASH_MOVEMENTS,
  INITIAL_CATEGORIES,
  INITIAL_EMPLOYEES,
  INITIAL_INGREDIENTS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_TABLES,
  Ingredient,
  PaymentMethod,
  PosOrder,
  Product,
  RestaurantSettings,
  RestaurantTable,
} from '../data/catalog';
import {
  apiRequest,
  enqueueOfflineAction,
  flushSyncQueue,
  loadSyncQueue,
  setApiBaseUrl,
} from '../lib/api';

export type NavTab =
  | 'pos'
  | 'orders'
  | 'tables'
  | 'kitchen'
  | 'products'
  | 'inventory'
  | 'reports'
  | 'employees'
  | 'settings';

export interface CartItem {
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  station: 'KITCHEN_HOT' | 'KITCHEN_COLD' | 'BAR';
  notes?: string;
}

const CACHE_KEY = 'oshxona_pos_state_cache_v1';

interface CachedData {
  categories: Category[];
  products: Product[];
  tables: RestaurantTable[];
  orders: PosOrder[];
  ingredients: Ingredient[];
  employees: Employee[];
  cashMovements: CashMovement[];
  settings: RestaurantSettings;
  orderCounter: number;
}

function loadCache(): Partial<CachedData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Partial<CachedData>) : {};
  } catch {
    return {};
  }
}

function saveCache(state: CachedData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function formatOrderNumber(counter: number): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `K1-${mm}${dd}-${String(counter).padStart(4, '0')}`;
}

interface PosState {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // POS Core State
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  selectedTable: { id: string; name: string } | null;
  cart: CartItem[];
  discountPercent: number;
  discountAmount: number;
  selectedPaymentMethod: PaymentMethod;
  isPaymentModalOpen: boolean;
  lastCompletedOrder: PosOrder | null;
  orderCounter: number;

  // Data collections (cached offline + synced online)
  categories: Category[];
  products: Product[];
  tables: RestaurantTable[];
  orders: PosOrder[];
  ingredients: Ingredient[];
  employees: Employee[];
  cashMovements: CashMovement[];
  settings: RestaurantSettings;

  // Cashier & Auth
  cashier: { id: string; name: string; role: string; discountLimit: number };

  // Offline & Sync UI State
  syncStatus: 'ONLINE' | 'SYNCING' | 'OFFLINE';
  pendingSyncCount: number;
  lastSyncedAt: string | null;
  syncError: string | null;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;

  // Toast helper
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;

  // POS Actions
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  setSelectedTable: (table: { id: string; name: string } | null) => void;
  addToCart: (product: Product) => void;
  updateQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  applyDiscountPercent: (percent: number) => { ok: boolean; error?: string };
  openPaymentModal: (method?: PaymentMethod) => void;
  setPaymentModalOpen: (open: boolean) => void;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;

  // Totals
  getSubtotal: () => number;
  getServiceFee: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;

  // Business Actions (API + Offline Queue)
  sendCartToKitchen: () => Promise<PosOrder | null>;
  completePayment: (params: {
    method: PaymentMethod;
    paidAmount: number;
    mixedCashAmount?: number;
    mixedCardAmount?: number;
  }) => Promise<PosOrder | null>;
  updateOrderStatus: (orderId: string, status: PosOrder['status']) => Promise<void>;
  cancelOrder: (orderId: string, adminPin: string, reason: string) => Promise<{ ok: boolean; error?: string }>;
  toggleKdsItemStatus: (orderId: string, itemId: string) => Promise<void>;
  markKdsOrderReady: (orderId: string) => Promise<void>;
  updateTableStatus: (tableId: string, status: RestaurantTable['status']) => Promise<void>;

  // Catalog, Inventory, Employees, Finance, Settings
  toggleFavorite: (productId: string) => void;
  toggleProductAvailability: (productId: string) => Promise<void>;
  saveProduct: (product: Omit<Product, 'id'> & { id?: string }) => Promise<void>;
  saveCategory: (category: { id?: string; name: string }) => Promise<void>;
  addIngredientStock: (ingredientId: string, quantity: number) => Promise<void>;
  addIngredient: (ing: Omit<Ingredient, 'id' | 'updatedAt'>) => Promise<void>;
  toggleEmployeeActive: (employeeId: string) => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  addCashMovement: (mov: Omit<CashMovement, 'id' | 'createdAt' | 'user'>) => Promise<void>;
  updateSettings: (partial: Partial<RestaurantSettings>) => void;

  // Sync & Backend Hydration
  checkConnectionAndSync: () => Promise<void>;
  hydrateFromServer: () => Promise<void>;
}

const cached = loadCache();

function persistSnapshot(s: PosState) {
  saveCache({
    categories: s.categories,
    products: s.products,
    tables: s.tables,
    orders: s.orders,
    ingredients: s.ingredients,
    employees: s.employees,
    cashMovements: s.cashMovements,
    settings: s.settings,
    orderCounter: s.orderCounter,
  });
}

export const usePosStore = create<PosState>((set, get) => ({
  activeTab: 'pos',
  setActiveTab: (tab) => set({ activeTab: tab }),

  orderType: 'DINE_IN',
  selectedTable: { id: 'tbl-7', name: 'Stol #7' },
  cart: [
    { itemId: '1', name: 'Choyxona Oshi', unitPrice: 38000, quantity: 2, totalPrice: 76000, station: 'KITCHEN_HOT' },
    { itemId: '17', name: 'Achchiq-chuchuk', unitPrice: 12000, quantity: 1, totalPrice: 12000, station: 'KITCHEN_COLD' },
    { itemId: '25', name: 'Ko\'k Choy (1L)', unitPrice: 6000, quantity: 1, totalPrice: 6000, station: 'BAR' },
  ],
  discountPercent: 0,
  discountAmount: 0,
  selectedPaymentMethod: 'CASH',
  isPaymentModalOpen: false,
  lastCompletedOrder: null,
  orderCounter: cached.orderCounter ?? 15,

  categories: cached.categories ?? INITIAL_CATEGORIES,
  products: cached.products ?? INITIAL_PRODUCTS,
  tables: cached.tables ?? INITIAL_TABLES,
  orders: cached.orders ?? INITIAL_ORDERS,
  ingredients: cached.ingredients ?? INITIAL_INGREDIENTS,
  employees: cached.employees ?? INITIAL_EMPLOYEES,
  cashMovements: cached.cashMovements ?? INITIAL_CASH_MOVEMENTS,
  settings: cached.settings ?? INITIAL_SETTINGS,

  cashier: { id: 'emp-2', name: 'Dilshod Aliyev', role: 'Kassir #1', discountLimit: 10 },

  syncStatus: typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'ONLINE',
  pendingSyncCount: loadSyncQueue().length,
  lastSyncedAt: null,
  syncError: null,
  toastMessage: null,

  showToast: (text, type = 'success') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      if (get().toastMessage?.text === text) {
        set({ toastMessage: null });
      }
    }, 3200);
  },
  clearToast: () => set({ toastMessage: null }),

  setOrderType: (type) =>
    set({
      orderType: type,
      selectedTable: type === 'DINE_IN' ? get().selectedTable ?? { id: 'tbl-7', name: 'Stol #7' } : null,
    }),

  setSelectedTable: (table) => set({ selectedTable: table, orderType: table ? 'DINE_IN' : get().orderType }),

  addToCart: (product) => {
    if (!product.isAvailable) {
      get().showToast(`${product.name} hozirda mavjud emas`, 'error');
      return;
    }
    const current = get().cart;
    const idx = current.findIndex((c) => c.itemId === product.id);
    let updated: CartItem[];
    if (idx >= 0) {
      updated = current.map((c, i) =>
        i === idx
          ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice }
          : c,
      );
    } else {
      updated = [
        ...current,
        {
          itemId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          totalPrice: product.price,
          station: product.station,
        },
      ];
    }
    const sub = updated.reduce((s, i) => s + i.totalPrice, 0);
    const discPct = get().discountPercent;
    set({
      cart: updated,
      discountAmount: Math.round((sub * discPct) / 100),
      lastCompletedOrder: null,
    });
  },

  updateQuantity: (index, delta) => {
    const current = [...get().cart];
    if (!current[index]) return;
    const nextQty = current[index].quantity + delta;
    if (nextQty <= 0) {
      current.splice(index, 1);
    } else {
      current[index] = {
        ...current[index],
        quantity: nextQty,
        totalPrice: nextQty * current[index].unitPrice,
      };
    }
    const sub = current.reduce((s, i) => s + i.totalPrice, 0);
    const discPct = get().discountPercent;
    set({ cart: current, discountAmount: Math.round((sub * discPct) / 100) });
  },

  removeFromCart: (index) => {
    const current = get().cart.filter((_, i) => i !== index);
    const sub = current.reduce((s, i) => s + i.totalPrice, 0);
    const discPct = get().discountPercent;
    set({ cart: current, discountAmount: Math.round((sub * discPct) / 100) });
  },

  clearCart: () => set({ cart: [], discountPercent: 0, discountAmount: 0 }),

  applyDiscountPercent: (percent) => {
    const limit = get().cashier.discountLimit;
    if (percent < 0 || percent > 100) {
      return { ok: false, error: 'Noto\'g\'ri chegirma foizi' };
    }
    if (percent > limit) {
      get().showToast(`Kassir chegirma limiti: maksimal ${limit}%`, 'error');
      return { ok: false, error: `Maksimal ruxsat etilgan chegirma: ${limit}%` };
    }
    const sub = get().getSubtotal();
    const amount = Math.round((sub * percent) / 100);
    set({ discountPercent: percent, discountAmount: amount });
    get().showToast(percent > 0 ? `${percent}% chegirma qo'llandi` : 'Chegirma olib tashlandi', 'info');
    return { ok: true };
  },

  openPaymentModal: (method) => {
    if (get().cart.length === 0) {
      get().showToast('Avval savatga mahsulot qo\'shing', 'error');
      return;
    }
    set({
      selectedPaymentMethod: method ?? get().selectedPaymentMethod,
      isPaymentModalOpen: true,
    });
  },

  setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open }),
  setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

  getSubtotal: () => get().cart.reduce((sum, i) => sum + i.totalPrice, 0),

  getServiceFee: () => {
    const { orderType, settings } = get();
    if (orderType !== 'DINE_IN' || settings.serviceFeePercent <= 0) return 0;
    return Math.round((get().getSubtotal() * settings.serviceFeePercent) / 100);
  },

  getTaxAmount: () => {
    const { settings } = get();
    if (settings.taxPercent <= 0) return 0;
    return Math.round((get().getSubtotal() * settings.taxPercent) / 100);
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    const fee = get().getServiceFee();
    const tax = get().getTaxAmount();
    const disc = get().discountAmount;
    return Math.max(0, sub + fee + tax - disc);
  },

  sendCartToKitchen: async () => {
    const state = get();
    if (state.cart.length === 0) {
      state.showToast('Savat bo\'sh', 'error');
      return null;
    }

    const nextCounter = state.orderCounter + 1;
    const orderNumber = formatOrderNumber(nextCounter);
    const subtotal = state.getSubtotal();
    const serviceFee = state.getServiceFee();
    const total = state.getTotal();

    const newOrder: PosOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      orderType: state.orderType,
      tableId: state.selectedTable?.id ?? null,
      tableName:
        state.orderType === 'DINE_IN'
          ? state.selectedTable?.name ?? 'Zal'
          : state.orderType === 'TAKEAWAY'
            ? 'Olib ketish'
            : 'Yetkazib berish',
      cashierName: state.cashier.name,
      items: state.cart.map((c, i) => ({
        id: `oi-${Date.now()}-${i}`,
        productId: c.itemId,
        name: c.name,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
        totalPrice: c.totalPrice,
        station: c.station,
        kitchenStatus: 'NEW',
        notes: c.notes,
      })),
      subtotal,
      discountPercent: state.discountPercent,
      discountAmount: state.discountAmount,
      serviceFee,
      total,
      status: 'NEW',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      syncState: 'PENDING_SYNC',
    };

    const payload = {
      orderType: newOrder.orderType,
      tableId: newOrder.tableId,
      items: newOrder.items.map((i) => ({ menuItemId: i.productId, quantity: i.quantity })),
    };

    const res = await apiRequest('/orders', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
      newOrder.syncState = 'SYNCED';
      set({ syncStatus: 'ONLINE', lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) });
    } else {
      const q = enqueueOfflineAction('/orders', 'POST', payload, `Buyurtma ${orderNumber}`);
      set({
        syncStatus: res.offline ? 'OFFLINE' : get().syncStatus,
        pendingSyncCount: q.length,
        syncError: res.error,
      });
    }

    const updatedTables = state.tables.map((t) =>
      t.id === state.selectedTable?.id
        ? { ...t, status: 'OCCUPIED' as const, currentOrderNumber: orderNumber, currentTotal: total }
        : t,
    );

    set({
      orders: [newOrder, ...state.orders],
      tables: updatedTables,
      orderCounter: nextCounter,
      cart: [],
      discountPercent: 0,
      discountAmount: 0,
    });
    persistSnapshot(get());
    get().showToast(`Buyurtma #${orderNumber} oshxonaga yuborildi`, 'success');
    return newOrder;
  },

  completePayment: async ({ method, paidAmount, mixedCashAmount, mixedCardAmount }) => {
    const state = get();
    if (state.cart.length === 0) return null;

    const nextCounter = state.orderCounter + 1;
    const orderNumber = formatOrderNumber(nextCounter);
    const subtotal = state.getSubtotal();
    const serviceFee = state.getServiceFee();
    const total = state.getTotal();
    const changeAmount = method === 'CASH' ? Math.max(0, paidAmount - total) : 0;

    const order: PosOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      orderType: state.orderType,
      tableId: state.selectedTable?.id ?? null,
      tableName:
        state.orderType === 'DINE_IN'
          ? state.selectedTable?.name ?? 'Zal'
          : state.orderType === 'TAKEAWAY'
            ? 'Olib ketish'
            : 'Yetkazib berish',
      cashierName: state.cashier.name,
      items: state.cart.map((c, i) => ({
        id: `oi-${Date.now()}-${i}`,
        productId: c.itemId,
        name: c.name,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
        totalPrice: c.totalPrice,
        station: c.station,
        kitchenStatus: 'NEW',
        notes: c.notes,
      })),
      subtotal,
      discountPercent: state.discountPercent,
      discountAmount: state.discountAmount,
      serviceFee,
      total,
      status: 'PAID',
      paymentMethod: method,
      paymentStatus: 'PAID',
      paidAmount,
      changeAmount,
      mixedCashAmount,
      mixedCardAmount,
      createdAt: new Date().toISOString(),
      syncState: 'SYNCED',
    };

    const payload = {
      orderType: order.orderType,
      tableId: order.tableId,
      paymentMethod: method,
      paidAmount,
      discountPercent: order.discountPercent,
      items: order.items.map((i) => ({ menuItemId: i.productId, quantity: i.quantity })),
    };

    const res = await apiRequest('/orders', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
      order.syncState = 'SYNCED';
      order.paymentStatus = 'PAID';
      set({
        syncStatus: 'ONLINE',
        lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        syncError: null,
      });
    } else {
      // Offline-first honesty: remote/card/QR payments cannot be falsely marked server-confirmed while offline
      order.syncState = 'PENDING_SYNC';
      order.paymentStatus = method === 'CASH' ? 'PENDING_SYNC' : 'PENDING_SYNC';
      const q = enqueueOfflineAction('/orders', 'POST', payload, `To'lov ${orderNumber}`);
      set({
        syncStatus: 'OFFLINE',
        pendingSyncCount: q.length,
        syncError: res.error,
      });
    }

    const updatedTables = state.tables.map((t) =>
      t.id === state.selectedTable?.id
        ? { ...t, status: 'AVAILABLE' as const, currentOrderNumber: undefined, currentTotal: undefined }
        : t,
    );

    const newMovement: CashMovement = {
      id: `cm-${Date.now()}`,
      type: 'INCOME',
      title: `Savdo cheki #${orderNumber}`,
      amount: total,
      method: method === 'CARD' ? 'CARD' : method === 'QR' ? 'QR' : 'CASH',
      createdAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      user: state.cashier.name,
    };

    set({
      orders: [order, ...state.orders],
      tables: updatedTables,
      cashMovements: [newMovement, ...state.cashMovements],
      orderCounter: nextCounter,
      lastCompletedOrder: order,
      cart: [],
      discountPercent: 0,
      discountAmount: 0,
      isPaymentModalOpen: false,
    });
    persistSnapshot(get());

    if (order.syncState === 'PENDING_SYNC') {
      get().showToast(`Offline saqlandi (#${orderNumber}) — sinxronizatsiya kutilmoqda`, 'info');
    } else {
      get().showToast(`To'lov muvaffaqiyatli yakunlandi (#${orderNumber})`, 'success');
    }

    return order;
  },

  updateOrderStatus: async (orderId, status) => {
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    });
    persistSnapshot(get());
    const res = await apiRequest(`/kds/orders/${orderId}/ready`, { method: 'PATCH' });
    if (!res.ok && res.offline) {
      const q = enqueueOfflineAction(`/kds/orders/${orderId}/ready`, 'PATCH', { status }, `Buyurtma holati`);
      set({ syncStatus: 'OFFLINE', pendingSyncCount: q.length });
    }
    get().showToast('Buyurtma holati yangilandi', 'success');
  },

  cancelOrder: async (orderId, adminPin, reason) => {
    const admin = get().employees.find((e) => e.role === 'ADMIN');
    const validPin = admin?.pinCode || '1111';
    if (adminPin !== validPin) {
      return { ok: false, error: 'Admin PIN-kodi noto\'g\'ri! (Standart: 1111)' };
    }
    set({
      orders: get().orders.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
    });
    persistSnapshot(get());
    const res = await apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ adminPin, reason }),
    });
    if (!res.ok && res.offline) {
      const q = enqueueOfflineAction(`/orders/${orderId}/cancel`, 'POST', { adminPin, reason }, `Bekor qilish`);
      set({ syncStatus: 'OFFLINE', pendingSyncCount: q.length });
    }
    get().showToast('Buyurtma bekor qilindi', 'info');
    return { ok: true };
  },

  toggleKdsItemStatus: async (orderId, itemId) => {
    const nextOrderList = get().orders.map((order) => {
      if (order.id !== orderId) return order;
      const items = order.items.map((item) => {
        if (item.id !== itemId) return item;
        const nextStatus: 'NEW' | 'PREPARING' | 'READY' =
          item.kitchenStatus === 'NEW'
            ? 'PREPARING'
            : item.kitchenStatus === 'PREPARING'
              ? 'READY'
              : 'PREPARING';
        return { ...item, kitchenStatus: nextStatus };
      });
      const allReady = items.every((i) => i.kitchenStatus === 'READY');
      const anyPreparing = items.some((i) => i.kitchenStatus === 'PREPARING');
      const status: PosOrder['status'] = allReady
        ? 'READY'
        : anyPreparing
          ? 'PREPARING'
          : order.status;
      return { ...order, items, status };
    });
    set({ orders: nextOrderList });
    persistSnapshot(get());
    await apiRequest(`/kds/items/${itemId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'READY' }) });
  },

  markKdsOrderReady: async (orderId) => {
    set({
      orders: get().orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'READY',
              items: order.items.map((i) => ({ ...i, kitchenStatus: 'READY' })),
            }
          : order,
      ),
    });
    persistSnapshot(get());
    const res = await apiRequest(`/kds/orders/${orderId}/ready`, { method: 'PATCH' });
    if (!res.ok && res.offline) {
      const q = enqueueOfflineAction(`/kds/orders/${orderId}/ready`, 'PATCH', {}, `Oshxona tayyor`);
      set({ syncStatus: 'OFFLINE', pendingSyncCount: q.length });
    }
    get().showToast('Buyurtma tayyor deb belgilandi', 'success');
  },

  updateTableStatus: async (tableId, status) => {
    set({
      tables: get().tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status,
              currentOrderNumber: status === 'AVAILABLE' ? undefined : t.currentOrderNumber,
              currentTotal: status === 'AVAILABLE' ? undefined : t.currentTotal,
            }
          : t,
      ),
    });
    persistSnapshot(get());
    const res = await apiRequest(`/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!res.ok && res.offline) {
      const q = enqueueOfflineAction(`/tables/${tableId}/status`, 'PATCH', { status }, `Stol holati`);
      set({ syncStatus: 'OFFLINE', pendingSyncCount: q.length });
    }
  },

  toggleFavorite: (productId) => {
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p,
      ),
    });
    persistSnapshot(get());
  },

  toggleProductAvailability: async (productId) => {
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p,
      ),
    });
    persistSnapshot(get());
    await apiRequest(`/menu-items/${productId}/toggle-availability`, { method: 'PATCH' });
  },

  saveProduct: async (product) => {
    const exists = product.id && get().products.some((p) => p.id === product.id);
    if (exists && product.id) {
      set({
        products: get().products.map((p) => (p.id === product.id ? { ...p, ...product, id: product.id } : p)),
      });
      await apiRequest(`/menu-items/${product.id}`, { method: 'PATCH', body: JSON.stringify(product) });
      get().showToast('Mahsulot yangilandi', 'success');
    } else {
      const created: Product = { ...product, id: `prod-${Date.now()}` };
      set({ products: [created, ...get().products] });
      await apiRequest('/menu-items', { method: 'POST', body: JSON.stringify(created) });
      get().showToast('Yangi mahsulot qo\'shildi', 'success');
    }
    persistSnapshot(get());
  },

  saveCategory: async ({ id, name }) => {
    if (id) {
      set({ categories: get().categories.map((c) => (c.id === id ? { ...c, name } : c)) });
      await apiRequest(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      get().showToast('Kategoriya yangilandi', 'success');
    } else {
      const created: Category = {
        id: `cat-${Date.now()}`,
        name,
        sortOrder: get().categories.length + 1,
      };
      set({ categories: [...get().categories, created] });
      await apiRequest('/categories', { method: 'POST', body: JSON.stringify(created) });
      get().showToast('Yangi kategoriya qo\'shildi', 'success');
    }
    persistSnapshot(get());
  },

  addIngredientStock: async (ingredientId, quantity) => {
    set({
      ingredients: get().ingredients.map((i) =>
        i.id === ingredientId
          ? {
              ...i,
              currentStock: Number((i.currentStock + quantity).toFixed(2)),
              updatedAt: 'Hozirgina',
            }
          : i,
      ),
    });
    persistSnapshot(get());
    await apiRequest('/stock/in', {
      method: 'POST',
      body: JSON.stringify({ ingredientId, quantity }),
    });
    get().showToast('Ombor qoldig\'i yangilandi', 'success');
  },

  addIngredient: async (ing) => {
    const created: Ingredient = {
      ...ing,
      id: `ing-${Date.now()}`,
      updatedAt: 'Hozirgina',
    };
    set({ ingredients: [created, ...get().ingredients] });
    persistSnapshot(get());
    await apiRequest('/ingredients', { method: 'POST', body: JSON.stringify(created) });
    get().showToast('Yangi xomashyo qo\'shildi', 'success');
  },

  toggleEmployeeActive: (employeeId) => {
    set({
      employees: get().employees.map((e) =>
        e.id === employeeId ? { ...e, isActive: !e.isActive } : e,
      ),
    });
    persistSnapshot(get());
  },

  addEmployee: (emp) => {
    const created: Employee = { ...emp, id: `emp-${Date.now()}` };
    set({ employees: [...get().employees, created] });
    persistSnapshot(get());
    get().showToast('Yangi xodim qo\'shildi', 'success');
  },

  addCashMovement: async (mov) => {
    const created: CashMovement = {
      ...mov,
      id: `cm-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      user: get().cashier.name,
    };
    set({ cashMovements: [created, ...get().cashMovements] });
    persistSnapshot(get());
    await apiRequest('/cash-movements', { method: 'POST', body: JSON.stringify(created) });
    get().showToast('Kassa operatsiyasi qayd etildi', 'success');
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    if (partial.apiUrl) {
      setApiBaseUrl(partial.apiUrl);
    }
    set({ settings: next });
    persistSnapshot(get());
    get().showToast('Sozlamalar saqlandi', 'success');
  },

  checkConnectionAndSync: async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      set({ syncStatus: 'OFFLINE', syncError: 'Internet aloqasi uzilgan' });
      return;
    }

    set({ syncStatus: 'SYNCING' });
    const ping = await apiRequest('/sync/status', { method: 'GET' }, 2500);

    if (!ping.ok && ping.offline) {
      set({
        syncStatus: 'OFFLINE',
        pendingSyncCount: loadSyncQueue().length,
        syncError: 'Lokal server (4000-port) bilan aloqa yo\'q — Offline rejim',
      });
      return;
    }

    const flushed = await flushSyncQueue();
    set({
      syncStatus: 'ONLINE',
      pendingSyncCount: flushed.remaining.length,
      lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      syncError: flushed.lastError,
    });
  },

  hydrateFromServer: async () => {
    await get().checkConnectionAndSync();
    const catRes = await apiRequest<Category[]>('/categories');
    if (catRes.ok && Array.isArray(catRes.data) && catRes.data.length > 0) {
      set({ categories: catRes.data });
    }
  },
}));
