export type ConflictResolutionStrategy = 'APPEND_ONLY' | 'LAST_WRITE_WINS';

/**
 * Tizimdagi entitiyalar bo'yicha konfliktni hal qilish siyosati
 */
export const ENTITY_CONFLICT_STRATEGIES: Record<string, ConflictResolutionStrategy> = {
  // Append-only (Faqat qo'shiladi, o'zgartirib bo'lmaydi)
  Order: 'APPEND_ONLY',
  OrderItem: 'APPEND_ONLY',
  Payment: 'APPEND_ONLY',
  Receipt: 'APPEND_ONLY',
  Shift: 'APPEND_ONLY',
  CashMovement: 'APPEND_ONLY',
  DebtTransaction: 'APPEND_ONLY',
  StockMovement: 'APPEND_ONLY',
  AuditLog: 'APPEND_ONLY',

  // Last-Write-Wins (Eng so'nggi updatedAt bo'yicha)
  Category: 'LAST_WRITE_WINS',
  MenuItem: 'LAST_WRITE_WINS',
  MenuItemVariant: 'LAST_WRITE_WINS',
  Modifier: 'LAST_WRITE_WINS',
  ModifierGroup: 'LAST_WRITE_WINS',
  Ingredient: 'LAST_WRITE_WINS',
  Recipe: 'LAST_WRITE_WINS',
  Setting: 'LAST_WRITE_WINS',
  Table: 'LAST_WRITE_WINS',
  User: 'LAST_WRITE_WINS',
  Customer: 'LAST_WRITE_WINS',
};

export class ConflictResolver {
  /**
   * Ikki yozuv to'qnashganda (conflict) qaysi biri ustunligini aniqlash
   */
  static shouldOverwrite(
    entityName: string,
    existingRecord: { version: number; updatedAt: Date | string },
    incomingRecord: { version: number; updatedAt: Date | string },
  ): boolean {
    const strategy = ENTITY_CONFLICT_STRATEGIES[entityName] || 'LAST_WRITE_WINS';

    // Agar append-only bo'lsa, hech qachon mavjudini ustiga yozmaymiz
    if (strategy === 'APPEND_ONLY') {
      return false;
    }

    // Last-Write-Wins: agar kelayotgan versiya yoki vaqt yangiroq bo'lsa
    const existingTime = new Date(existingRecord.updatedAt).getTime();
    const incomingTime = new Date(incomingRecord.updatedAt).getTime();

    if (incomingTime > existingTime) {
      return true;
    }

    return incomingRecord.version > existingRecord.version;
  }
}
