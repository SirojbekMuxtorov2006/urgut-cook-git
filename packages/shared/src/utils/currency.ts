/**
 * O'zbekiston so'mini chiroyli formatlash: 35000 -> "35 000 so'm"
 */
export function formatCurrency(amount: number, withSuffix = true): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return withSuffix ? `${formatted} so'm` : formatted;
}

/**
 * Xizmat haqini yaxlitlab hisoblash (so'm tiyinsiz)
 */
export function calculateServiceFee(subtotal: number, percentage: number): number {
  if (percentage <= 0) return 0;
  return Math.round((subtotal * percentage) / 100);
}

/**
 * Chegirma hisoblash (foiz yoki qat'iy summa)
 */
export function calculateDiscount(
  subtotal: number,
  options: { percent?: number; amount?: number }
): number {
  if (options.amount && options.amount > 0) {
    return Math.min(Math.round(options.amount), subtotal);
  }
  if (options.percent && options.percent > 0) {
    const calculated = Math.round((subtotal * options.percent) / 100);
    return Math.min(calculated, subtotal);
  }
  return 0;
}

/**
 * Qaytim hisoblash (to'langan summa - umumiy summa)
 */
export function calculateChange(paidAmount: number, totalAmount: number): number {
  const diff = paidAmount - totalAmount;
  return diff > 0 ? Math.round(diff) : 0;
}
