export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export type FoodArtworkType =
  | 'plov'
  | 'lagman'
  | 'manti'
  | 'kabob'
  | 'soup'
  | 'shashlik'
  | 'salad'
  | 'somsa'
  | 'bread'
  | 'tea'
  | 'drink'
  | 'dessert';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  costPrice: number;
  isAvailable: boolean;
  isFavorite: boolean;
  artwork: FoodArtworkType;
  station: 'KITCHEN_HOT' | 'KITCHEN_COLD' | 'BAR';
}

export interface RestaurantTable {
  id: string;
  name: string;
  hall: string;
  seats: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  currentOrderNumber?: string;
  currentTotal?: number;
  guestCount?: number;
}

export interface PosOrderItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  station: 'KITCHEN_HOT' | 'KITCHEN_COLD' | 'BAR';
  kitchenStatus: 'NEW' | 'PREPARING' | 'READY';
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'QR' | 'MIXED' | 'DEBT';

export interface PosOrder {
  id: string;
  orderNumber: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId: string | null;
  tableName: string;
  cashierName: string;
  items: PosOrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  serviceFee: number;
  total: number;
  status: 'NEW' | 'PREPARING' | 'READY' | 'PAID' | 'CANCELLED';
  paymentMethod?: PaymentMethod;
  paymentStatus: 'UNPAID' | 'PAID' | 'PENDING_SYNC';
  paidAmount?: number;
  changeAmount?: number;
  mixedCashAmount?: number;
  mixedCardAmount?: number;
  createdAt: string;
  syncState: 'SYNCED' | 'PENDING_SYNC';
}

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  costPerUnit: number;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'CASHIER' | 'WAITER' | 'CHEF';
  roleLabel: string;
  branch: string;
  pinCode: string;
  discountLimit: number;
  isActive: boolean;
}

export interface CashMovement {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'CASH_IN' | 'CASH_OUT';
  title: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'QR';
  createdAt: string;
  user: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  branchName: string;
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
  serviceFeePercent: number;
  taxPercent: number;
  printerWidth: '58mm' | '80mm';
  printerName: string;
  autoPrintReceipt: boolean;
  enableCash: boolean;
  enableCard: boolean;
  enableQr: boolean;
  enableMixed: boolean;
  qrProviderLabel: string;
  apiUrl: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Ikkinchi taomlar', sortOrder: 1 },
  { id: '2', name: 'Birinchi taomlar', sortOrder: 2 },
  { id: '3', name: 'Shashliklar', sortOrder: 3 },
  { id: '4', name: 'Salatlar', sortOrder: 4 },
  { id: '5', name: 'Non va somsa', sortOrder: 5 },
  { id: '6', name: 'Ichimliklar', sortOrder: 6 },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', categoryId: '1', name: 'Choyxona Oshi', price: 38000, costPrice: 22000, isAvailable: true, isFavorite: true, artwork: 'plov', station: 'KITCHEN_HOT' },
  { id: '2', categoryId: '1', name: 'To\'y Oshi (mayizli)', price: 42000, costPrice: 24500, isAvailable: true, isFavorite: true, artwork: 'plov', station: 'KITCHEN_HOT' },
  { id: '3', categoryId: '1', name: 'Qovurma Lag\'mon', price: 38000, costPrice: 21000, isAvailable: true, isFavorite: true, artwork: 'lagman', station: 'KITCHEN_HOT' },
  { id: '4', categoryId: '1', name: 'Cho\'zma Lag\'mon', price: 36000, costPrice: 20000, isAvailable: true, isFavorite: false, artwork: 'lagman', station: 'KITCHEN_HOT' },
  { id: '5', categoryId: '1', name: 'Go\'shtli Manti (4 dona)', price: 36000, costPrice: 19500, isAvailable: true, isFavorite: true, artwork: 'manti', station: 'KITCHEN_HOT' },
  { id: '6', categoryId: '1', name: 'Qozon Kabob', price: 65000, costPrice: 38000, isAvailable: true, isFavorite: true, artwork: 'kabob', station: 'KITCHEN_HOT' },
  { id: '7', categoryId: '1', name: 'Toshkentcha Norin', price: 48000, costPrice: 27000, isAvailable: true, isFavorite: false, artwork: 'lagman', station: 'KITCHEN_COLD' },
  { id: '8', categoryId: '1', name: 'Jiz-biz (tovada)', price: 58000, costPrice: 34000, isAvailable: true, isFavorite: false, artwork: 'kabob', station: 'KITCHEN_HOT' },

  { id: '9', categoryId: '2', name: 'Qo\'y go\'shtli Sho\'rva', price: 35000, costPrice: 19000, isAvailable: true, isFavorite: true, artwork: 'soup', station: 'KITCHEN_HOT' },
  { id: '10', categoryId: '2', name: 'No\'xat Sho\'rva', price: 32000, costPrice: 17000, isAvailable: true, isFavorite: false, artwork: 'soup', station: 'KITCHEN_HOT' },
  { id: '11', categoryId: '2', name: 'Mastava', price: 30000, costPrice: 15500, isAvailable: true, isFavorite: false, artwork: 'soup', station: 'KITCHEN_HOT' },
  { id: '12', categoryId: '2', name: 'Sho\'rvali Chuchvara', price: 34000, costPrice: 18000, isAvailable: true, isFavorite: false, artwork: 'soup', station: 'KITCHEN_HOT' },

  { id: '13', categoryId: '3', name: 'Qiyma Shashlik', price: 16000, costPrice: 9500, isAvailable: true, isFavorite: true, artwork: 'shashlik', station: 'KITCHEN_HOT' },
  { id: '14', categoryId: '3', name: 'Kuskovoy Shashlik', price: 22000, costPrice: 13500, isAvailable: true, isFavorite: true, artwork: 'shashlik', station: 'KITCHEN_HOT' },
  { id: '15', categoryId: '3', name: 'Jigar Shashlik', price: 18000, costPrice: 10500, isAvailable: true, isFavorite: false, artwork: 'shashlik', station: 'KITCHEN_HOT' },
  { id: '16', categoryId: '3', name: 'Qovurg\'a Shashlik', price: 26000, costPrice: 16000, isAvailable: true, isFavorite: false, artwork: 'shashlik', station: 'KITCHEN_HOT' },

  { id: '17', categoryId: '4', name: 'Achchiq-chuchuk', price: 12000, costPrice: 5500, isAvailable: true, isFavorite: true, artwork: 'salad', station: 'KITCHEN_COLD' },
  { id: '18', categoryId: '4', name: 'Bahor salati', price: 14000, costPrice: 6500, isAvailable: true, isFavorite: false, artwork: 'salad', station: 'KITCHEN_COLD' },
  { id: '19', categoryId: '4', name: 'Suzma ko\'katli', price: 10000, costPrice: 4500, isAvailable: true, isFavorite: false, artwork: 'salad', station: 'KITCHEN_COLD' },
  { id: '20', categoryId: '4', name: 'Fransuzcha salat', price: 20000, costPrice: 10000, isAvailable: true, isFavorite: false, artwork: 'salad', station: 'KITCHEN_COLD' },

  { id: '21', categoryId: '5', name: 'Tandir Somsa', price: 12000, costPrice: 6500, isAvailable: true, isFavorite: true, artwork: 'somsa', station: 'KITCHEN_HOT' },
  { id: '22', categoryId: '5', name: 'Qatlama Somsa', price: 10000, costPrice: 5500, isAvailable: true, isFavorite: false, artwork: 'somsa', station: 'KITCHEN_HOT' },
  { id: '23', categoryId: '5', name: 'Tandir Non', price: 5000, costPrice: 2500, isAvailable: true, isFavorite: true, artwork: 'bread', station: 'KITCHEN_HOT' },
  { id: '24', categoryId: '5', name: 'Samarqand Patir', price: 12000, costPrice: 6000, isAvailable: true, isFavorite: false, artwork: 'bread', station: 'KITCHEN_HOT' },

  { id: '25', categoryId: '6', name: 'Ko\'k Choy (1L)', price: 6000, costPrice: 2000, isAvailable: true, isFavorite: true, artwork: 'tea', station: 'BAR' },
  { id: '26', categoryId: '6', name: 'Qora Choy (1L)', price: 6000, costPrice: 2000, isAvailable: true, isFavorite: false, artwork: 'tea', station: 'BAR' },
  { id: '27', categoryId: '6', name: 'Limonli Asalli Choy', price: 14000, costPrice: 5000, isAvailable: true, isFavorite: false, artwork: 'tea', station: 'BAR' },
  { id: '28', categoryId: '6', name: 'Uy Kompoti (1L)', price: 18000, costPrice: 7000, isAvailable: true, isFavorite: false, artwork: 'drink', station: 'BAR' },
  { id: '29', categoryId: '6', name: 'Coca-Cola 1.5L', price: 16000, costPrice: 10500, isAvailable: true, isFavorite: true, artwork: 'drink', station: 'BAR' },
];

export const INITIAL_TABLES: RestaurantTable[] = [
  { id: 'tbl-1', name: 'Stol #1', hall: 'Asosiy zal', seats: 4, status: 'AVAILABLE' },
  { id: 'tbl-2', name: 'Stol #2', hall: 'Asosiy zal', seats: 4, status: 'OCCUPIED', currentOrderNumber: 'K1-1120-0011', currentTotal: 118000, guestCount: 3 },
  { id: 'tbl-3', name: 'Stol #3', hall: 'Asosiy zal', seats: 6, status: 'AVAILABLE' },
  { id: 'tbl-4', name: 'Stol #4', hall: 'Asosiy zal', seats: 4, status: 'RESERVED', guestCount: 4 },
  { id: 'tbl-5', name: 'Stol #5', hall: 'Asosiy zal', seats: 6, status: 'AVAILABLE' },
  { id: 'tbl-6', name: 'Stol #6', hall: 'Asosiy zal', seats: 4, status: 'OCCUPIED', currentOrderNumber: 'K1-1120-0012', currentTotal: 184000, guestCount: 4 },
  { id: 'tbl-7', name: 'Stol #7', hall: 'Asosiy zal', seats: 4, status: 'OCCUPIED', currentOrderNumber: 'K1-1120-0014', currentTotal: 103400, guestCount: 2 },
  { id: 'tbl-8', name: 'Stol #8', hall: 'Asosiy zal', seats: 8, status: 'AVAILABLE' },
  { id: 'tbl-9', name: 'VIP #1', hall: 'VIP xonalar', seats: 10, status: 'RESERVED', guestCount: 8 },
  { id: 'tbl-10', name: 'VIP #2', hall: 'VIP xonalar', seats: 12, status: 'OCCUPIED', currentOrderNumber: 'K1-1120-0013', currentTotal: 268000, guestCount: 6 },
  { id: 'tbl-11', name: 'Terrasa #1', hall: 'Yozgi terrasa', seats: 4, status: 'AVAILABLE' },
  { id: 'tbl-12', name: 'Terrasa #2', hall: 'Yozgi terrasa', seats: 6, status: 'AVAILABLE' },
];

export const INITIAL_ORDERS: PosOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'K1-1120-0012',
    orderType: 'DINE_IN',
    tableId: 'tbl-6',
    tableName: 'Stol #6',
    cashierName: 'Dilshod Aliyev',
    items: [
      { id: 'oi-1', productId: '1', name: 'Choyxona Oshi', unitPrice: 38000, quantity: 2, totalPrice: 76000, station: 'KITCHEN_HOT', kitchenStatus: 'PREPARING' },
      { id: 'oi-2', productId: '17', name: 'Achchiq-chuchuk', unitPrice: 12000, quantity: 2, totalPrice: 24000, station: 'KITCHEN_COLD', kitchenStatus: 'READY' },
      { id: 'oi-3', productId: '14', name: 'Kuskovoy Shashlik', unitPrice: 22000, quantity: 3, totalPrice: 66000, station: 'KITCHEN_HOT', kitchenStatus: 'PREPARING' },
    ],
    subtotal: 166000,
    discountPercent: 0,
    discountAmount: 0,
    serviceFee: 16600,
    total: 182600,
    status: 'PREPARING',
    paymentStatus: 'UNPAID',
    createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    syncState: 'SYNCED',
  },
  {
    id: 'ord-102',
    orderNumber: 'K1-1120-0013',
    orderType: 'DINE_IN',
    tableId: 'tbl-10',
    tableName: 'VIP #2',
    cashierName: 'Dilshod Aliyev',
    items: [
      { id: 'oi-4', productId: '6', name: 'Qozon Kabob', unitPrice: 65000, quantity: 2, totalPrice: 130000, station: 'KITCHEN_HOT', kitchenStatus: 'NEW', notes: 'Piyozsiz bo\'lsin' },
      { id: 'oi-5', productId: '14', name: 'Kuskovoy Shashlik', unitPrice: 22000, quantity: 4, totalPrice: 88000, station: 'KITCHEN_HOT', kitchenStatus: 'NEW' },
      { id: 'oi-6', productId: '25', name: 'Ko\'k Choy (1L)', unitPrice: 6000, quantity: 2, totalPrice: 12000, station: 'BAR', kitchenStatus: 'READY' },
    ],
    subtotal: 230000,
    discountPercent: 0,
    discountAmount: 0,
    serviceFee: 23000,
    total: 253000,
    status: 'NEW',
    paymentStatus: 'UNPAID',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    syncState: 'SYNCED',
  },
  {
    id: 'ord-103',
    orderNumber: 'K1-1120-0010',
    orderType: 'TAKEAWAY',
    tableId: null,
    tableName: 'Olib ketish',
    cashierName: 'Madina Karimova',
    items: [
      { id: 'oi-7', productId: '21', name: 'Tandir Somsa', unitPrice: 12000, quantity: 6, totalPrice: 72000, station: 'KITCHEN_HOT', kitchenStatus: 'READY' },
      { id: 'oi-8', productId: '29', name: 'Coca-Cola 1.5L', unitPrice: 16000, quantity: 1, totalPrice: 16000, station: 'BAR', kitchenStatus: 'READY' },
    ],
    subtotal: 88000,
    discountPercent: 0,
    discountAmount: 0,
    serviceFee: 0,
    total: 88000,
    status: 'PAID',
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    paidAmount: 100000,
    changeAmount: 12000,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    syncState: 'SYNCED',
  },
  {
    id: 'ord-104',
    orderNumber: 'K1-1120-0009',
    orderType: 'DINE_IN',
    tableId: 'tbl-2',
    tableName: 'Stol #2',
    cashierName: 'Dilshod Aliyev',
    items: [
      { id: 'oi-9', productId: '3', name: 'Qovurma Lag\'mon', unitPrice: 38000, quantity: 2, totalPrice: 76000, station: 'KITCHEN_HOT', kitchenStatus: 'READY' },
      { id: 'oi-10', productId: '9', name: 'Qo\'y go\'shtli Sho\'rva', unitPrice: 35000, quantity: 1, totalPrice: 35000, station: 'KITCHEN_HOT', kitchenStatus: 'READY' },
    ],
    subtotal: 111000,
    discountPercent: 5,
    discountAmount: 5550,
    serviceFee: 11100,
    total: 116550,
    status: 'PAID',
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    paidAmount: 116550,
    changeAmount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    syncState: 'SYNCED',
  },
  {
    id: 'ord-105',
    orderNumber: 'K1-1120-0008',
    orderType: 'TAKEAWAY',
    tableId: null,
    tableName: 'Olib ketish',
    cashierName: 'Madina Karimova',
    items: [
      { id: 'oi-11', productId: '1', name: 'Choyxona Oshi', unitPrice: 38000, quantity: 3, totalPrice: 114000, station: 'KITCHEN_HOT', kitchenStatus: 'READY' },
      { id: 'oi-12', productId: '23', name: 'Tandir Non', unitPrice: 5000, quantity: 2, totalPrice: 10000, station: 'KITCHEN_HOT', kitchenStatus: 'READY' },
    ],
    subtotal: 124000,
    discountPercent: 0,
    discountAmount: 0,
    serviceFee: 0,
    total: 124000,
    status: 'PAID',
    paymentMethod: 'QR',
    paymentStatus: 'PAID',
    paidAmount: 124000,
    changeAmount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    syncState: 'SYNCED',
  },
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Mol go\'shti (lahm)', currentStock: 18.5, minStock: 10, unit: 'kg', costPerUnit: 98000, updatedAt: 'Bugun, 09:00' },
  { id: 'ing-2', name: 'Qo\'y go\'shti', currentStock: 6.2, minStock: 8, unit: 'kg', costPerUnit: 105000, updatedAt: 'Bugun, 09:00' },
  { id: 'ing-3', name: 'Lazer guruch', currentStock: 34, minStock: 15, unit: 'kg', costPerUnit: 24000, updatedAt: 'Bugun, 08:30' },
  { id: 'ing-4', name: 'Sariq sabzi', currentStock: 22, minStock: 12, unit: 'kg', costPerUnit: 6000, updatedAt: 'Bugun, 08:30' },
  { id: 'ing-5', name: 'Paxta yog\'i', currentStock: 8.5, minStock: 10, unit: 'litr', costPerUnit: 19000, updatedAt: 'Kecha, 19:20' },
  { id: 'ing-6', name: 'Piyoz', currentStock: 28, minStock: 10, unit: 'kg', costPerUnit: 4500, updatedAt: 'Bugun, 08:30' },
  { id: 'ing-7', name: 'Pomidor', currentStock: 4.5, minStock: 8, unit: 'kg', costPerUnit: 14000, updatedAt: 'Bugun, 10:15' },
  { id: 'ing-8', name: 'Un (oliy nav)', currentStock: 42, minStock: 20, unit: 'kg', costPerUnit: 8500, updatedAt: 'Kecha, 18:00' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Sardor Rahimov', username: 'admin', role: 'ADMIN', roleLabel: 'Administrator', branch: 'Asosiy filial (Chilonzor)', pinCode: '1111', discountLimit: 100, isActive: true },
  { id: 'emp-2', name: 'Dilshod Aliyev', username: 'kassir1', role: 'CASHIER', roleLabel: 'Kassir #1', branch: 'Asosiy filial (Chilonzor)', pinCode: '1234', discountLimit: 10, isActive: true },
  { id: 'emp-3', name: 'Madina Karimova', username: 'kassir2', role: 'CASHIER', roleLabel: 'Kassir #2', branch: 'Asosiy filial (Chilonzor)', pinCode: '5678', discountLimit: 10, isActive: true },
  { id: 'emp-4', name: 'Sirojbek Usmonov', username: 'ofitsiant1', role: 'WAITER', roleLabel: 'Ofitsiant', branch: 'Asosiy filial (Chilonzor)', pinCode: '2222', discountLimit: 0, isActive: true },
  { id: 'emp-5', name: 'Bahrom Tursunov', username: 'oshpaz1', role: 'CHEF', roleLabel: 'Bosh oshpaz', branch: 'Asosiy filial (Chilonzor)', pinCode: '3333', discountLimit: 0, isActive: true },
];

export const INITIAL_CASH_MOVEMENTS: CashMovement[] = [
  { id: 'cm-1', type: 'CASH_IN', title: 'Smena ochilishi (Kassa qoldig\'i)', amount: 500000, method: 'CASH', createdAt: 'Bugun, 09:00', user: 'Dilshod Aliyev' },
  { id: 'cm-2', type: 'EXPENSE', title: 'Ko\'kat va sabzavot xaridi (bozor)', amount: 185000, method: 'CASH', createdAt: 'Bugun, 10:40', user: 'Sardor Rahimov' },
  { id: 'cm-3', type: 'EXPENSE', title: 'Termal chek lentasi (80mm, 10 dona)', amount: 65000, method: 'CASH', createdAt: 'Bugun, 11:30', user: 'Dilshod Aliyev' },
];

export const INITIAL_SETTINGS: RestaurantSettings = {
  restaurantName: 'Rayhon Milliy Taomlari',
  branchName: 'Asosiy filial (Chilonzor)',
  address: 'Toshkent sh., Chilonzor tumani, Bunyodkor 15',
  phone: '+998 71 200 45 45',
  receiptHeader: 'RAYHON MILLIY TAOMLARI\nXush kelibsiz!',
  receiptFooter: 'Tashrifingiz uchun rahmat!\nYoqimli ishtaha!',
  serviceFeePercent: 10,
  taxPercent: 0,
  printerWidth: '80mm',
  printerName: 'XP-80C Termal Printer (USB)',
  autoPrintReceipt: true,
  enableCash: true,
  enableCard: true,
  enableQr: true,
  enableMixed: true,
  qrProviderLabel: 'Click / Payme QR',
  apiUrl: 'http://localhost:4000/api',
};
