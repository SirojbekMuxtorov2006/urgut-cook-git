export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
}

export enum DeviceType {
  POS = 'POS',
  KDS = 'KDS',
  WAITER_APP = 'WAITER_APP',
  ADMIN_PANEL = 'ADMIN_PANEL',
}

export enum Unit {
  PORTION = 'PORTION',
  KG = 'KG',
  PIECE = 'PIECE',
  LITER = 'LITER',
  BOTTLE = 'BOTTLE',
  CUP = 'CUP',
}

export enum StockMovementType {
  IN = 'IN',
  OUT_SALE = 'OUT_SALE',
  WASTE = 'WASTE',
  ADJUST = 'ADJUST',
  RETURN = 'RETURN',
}

export enum TableStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  RESERVED = 'RESERVED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
  OPEN = 'OPEN',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  CLICK = 'CLICK',
  PAYME = 'PAYME',
  DEBT = 'DEBT',
  MIXED = 'MIXED',
}

export enum ReceiptType {
  SALE = 'SALE',
  KITCHEN = 'KITCHEN',
  COPY = 'COPY',
  Z_REPORT = 'Z_REPORT',
  X_REPORT = 'X_REPORT',
}

export enum CashMovementType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
  EXPENSE = 'EXPENSE',
  COLLECTION = 'COLLECTION',
}

export enum PrinterType {
  USB = 'USB',
  NETWORK = 'NETWORK',
  BLUETOOTH = 'BLUETOOTH',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
