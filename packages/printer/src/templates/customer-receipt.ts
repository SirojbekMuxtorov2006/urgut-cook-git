import {
  ESC_POS,
  formatTwoColumns,
  formatDivider,
  formatCentered,
} from '../escpos.js';
import { formatCurrency } from '@oshxona/shared';

export interface CustomerReceiptData {
  restaurantName: string;
  address?: string;
  phone?: string;
  receiptNumber: string;
  orderNumber: string;
  date: Date;
  cashierName: string;
  tableName?: string;
  orderType: string;
  isCopy?: boolean;
  copyNumber?: number;
  items: {
    name: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: { name: string; price: number }[];
  }[];
  subtotal: number;
  serviceFeePercent?: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  change: number;
  headerNote?: string;
  footerNote?: string;
}

export function generateCustomerReceiptText(
  data: CustomerReceiptData,
  width: 58 | 80 = 80,
): string {
  const lines: string[] = [];
  const div = formatDivider('-', width);
  const doubleDiv = formatDivider('=', width);

  // Sarlavha
  if (data.isCopy) {
    lines.push(formatCentered(`*** NUSXA #${data.copyNumber || 1} ***`, width));
  }
  lines.push(formatCentered(`🍽️ ${data.restaurantName.toUpperCase()}`, width));
  if (data.address) lines.push(formatCentered(data.address, width));
  if (data.phone) lines.push(formatCentered(`Tel: ${data.phone}`, width));
  lines.push(div);

  // Meta ma'lumotlar
  lines.push(formatTwoColumns(`Chek №: ${data.receiptNumber}`, `Buyurtma: ${data.orderNumber}`, width));
  const dateStr = data.date.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  lines.push(formatTwoColumns(`Sana: ${dateStr}`, data.tableName ? `Stol: ${data.tableName}` : data.orderType, width));
  lines.push(formatTwoColumns(`Kassir: ${data.cashierName}`, '', width));
  lines.push(div);

  // Taomlar ro'yxati
  for (const item of data.items) {
    const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    const qtyPrice = `${item.quantity} x ${formatCurrency(item.unitPrice, false)}`;
    const total = formatCurrency(item.totalPrice, false);

    lines.push(formatTwoColumns(itemName, total, width));
    lines.push(`  ${qtyPrice}`);

    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        lines.push(`    ${mod.name} (+${formatCurrency(mod.price, false)})`);
      }
    }
  }
  lines.push(div);

  // Hisob-kitob
  lines.push(formatTwoColumns('Jami:', formatCurrency(data.subtotal), width));
  if (data.serviceFee > 0) {
    const feeLabel = `Xizmat haqi (${data.serviceFeePercent || 10}%):`;
    lines.push(formatTwoColumns(feeLabel, formatCurrency(data.serviceFee), width));
  }
  if (data.discount > 0) {
    lines.push(formatTwoColumns('Chegirma:', `-${formatCurrency(data.discount)}`, width));
  }
  lines.push(doubleDiv);

  // To'lovga yakuniy
  lines.push(formatTwoColumns("TO'LOVGA:", formatCurrency(data.total), width));
  lines.push(formatTwoColumns(`To'lov: ${data.paymentMethod}`, formatCurrency(data.paidAmount), width));
  if (data.change > 0) {
    lines.push(formatTwoColumns('Qaytim:', formatCurrency(data.change), width));
  }
  lines.push(div);

  // Taglavha
  lines.push(formatCentered(data.footerNote || 'Xaridingiz uchun rahmat!', width));
  lines.push(formatCentered('Yana kutib qolamiz!', width));
  lines.push('\n\n');

  return lines.join('\n');
}

/**
 * ESC/POS xom baytlari ko'rinishida generatsiya qilish
 */
export function generateCustomerReceiptEscPos(
  data: CustomerReceiptData,
  width: 58 | 80 = 80,
): string {
  let commands = '';
  commands += ESC_POS.INIT;
  commands += ESC_POS.ALIGN_CENTER;

  if (data.isCopy) {
    commands += ESC_POS.BOLD_ON;
    commands += `*** NUSXA #${data.copyNumber || 1} ***\n`;
    commands += ESC_POS.BOLD_OFF;
  }

  // Restoran nomi (Katta shriftda)
  commands += ESC_POS.DOUBLE_ON;
  commands += `${data.restaurantName}\n`;
  commands += ESC_POS.DOUBLE_OFF;

  if (data.address) commands += `${data.address}\n`;
  if (data.phone) commands += `Tel: ${data.phone}\n`;

  commands += ESC_POS.ALIGN_LEFT;
  commands += `${formatDivider('-', width)}\n`;
  commands += `${formatTwoColumns(`Chek №: ${data.receiptNumber}`, `Stol: ${data.tableName || data.orderType}`, width)}\n`;
  commands += `${formatTwoColumns(`Kassir: ${data.cashierName}`, data.date.toLocaleDateString(), width)}\n`;
  commands += `${formatDivider('-', width)}\n`;

  // Taomlar
  for (const item of data.items) {
    const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    commands += `${formatTwoColumns(itemName, formatCurrency(item.totalPrice, false), width)}\n`;
    commands += `  ${item.quantity} x ${formatCurrency(item.unitPrice, false)}\n`;
  }

  commands += `${formatDivider('-', width)}\n`;
  commands += `${formatTwoColumns('Jami:', formatCurrency(data.subtotal), width)}\n`;
  if (data.serviceFee > 0) {
    commands += `${formatTwoColumns(`Xizmat (${data.serviceFeePercent || 10}%):`, formatCurrency(data.serviceFee), width)}\n`;
  }
  if (data.discount > 0) {
    commands += `${formatTwoColumns('Chegirma:', `-${formatCurrency(data.discount)}`, width)}\n`;
  }

  commands += `${formatDivider('=', width)}\n`;
  commands += ESC_POS.BOLD_ON;
  commands += `${formatTwoColumns("TO'LOVGA:", formatCurrency(data.total), width)}\n`;
  commands += ESC_POS.BOLD_OFF;

  commands += `${formatTwoColumns(`Usul: ${data.paymentMethod}`, formatCurrency(data.paidAmount), width)}\n`;
  if (data.change > 0) {
    commands += `${formatTwoColumns('Qaytim:', formatCurrency(data.change), width)}\n`;
  }

  commands += `${formatDivider('-', width)}\n`;
  commands += ESC_POS.ALIGN_CENTER;
  commands += `${data.footerNote || 'Xaridingiz uchun rahmat!'}\n\n\n\n`;

  // Kassa tortmasini ochish va qog'ozni kesish
  commands += ESC_POS.DRAWER_KICK;
  commands += ESC_POS.CUT_PARTIAL;

  return commands;
}
