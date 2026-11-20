import { OutboxItem } from './outbox.types.js';

/**
 * Electron Kassa uchun Favqulodda Lokal SQLite Saqlash Interfeysi
 * (Agar lokal server tarmog'i ham uzilsa, kassa to'xtamaydi)
 */
export interface IOfflineEmergencyStorage {
  saveOfflineOrder(orderData: Record<string, unknown>): Promise<void>;
  saveOfflinePayment(paymentData: Record<string, unknown>): Promise<void>;
  getPendingOfflineItems(): Promise<OutboxItem[]>;
  markItemsSynced(ids: string[]): Promise<void>;
  getOfflineCatalog(): Promise<Record<string, unknown>[]>;
  cacheCatalog(catalog: Record<string, unknown>[]): Promise<void>;
}
