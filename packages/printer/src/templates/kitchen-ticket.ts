import { ESC_POS, formatTwoColumns, formatDivider, formatCentered } from '../escpos.js';

export interface KitchenTicketData {
  orderNumber: string;
  tableName?: string;
  stationName?: string; // Issiq sex, Salat sex, Bar
  waiterName?: string;
  sentAt: Date;
  items: {
    name: string;
    variantName?: string;
    quantity: number;
    modifiers?: { name: string }[];
    notes?: string;
  }[];
}

export function generateKitchenTicketText(
  data: KitchenTicketData,
  width: 58 | 80 = 80,
): string {
  const lines: string[] = [];
  const div = formatDivider('=', width);

  lines.push(div);
  lines.push(formatCentered(`*** OSHXONA CHIPTASI (${data.stationName || 'ASOSIY SEX'}) ***`, width));
  lines.push(formatTwoColumns(`Stol: ${data.tableName || 'OLIB KETISH'}`, `№: ${data.orderNumber}`, width));
  lines.push(formatTwoColumns(
    `Ofitsiant: ${data.waiterName || 'Kassa'}`,
    data.sentAt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    width,
  ));
  lines.push(div);

  for (const item of data.items) {
    const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    lines.push(formatTwoColumns(itemName, `x ${item.quantity}`, width));

    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        lines.push(`  + ${mod.name}`);
      }
    }

    if (item.notes) {
      lines.push(`  IZOH: ${item.notes}`);
    }
  }

  lines.push(div);
  lines.push('\n\n');

  return lines.join('\n');
}

export function generateKitchenTicketEscPos(
  data: KitchenTicketData,
  width: 58 | 80 = 80,
): string {
  let commands = '';
  commands += ESC_POS.INIT;
  commands += ESC_POS.ALIGN_CENTER;
  commands += ESC_POS.DOUBLE_ON;
  commands += `STOL: ${data.tableName || 'OLIB KETISH'}\n`;
  commands += ESC_POS.DOUBLE_OFF;

  commands += `${data.stationName || 'OSHXONA'} | № ${data.orderNumber}\n`;
  commands += `${data.sentAt.toLocaleTimeString()} | Ofitsiant: ${data.waiterName || 'Kassa'}\n`;
  commands += `${formatDivider('=', width)}\n`;

  commands += ESC_POS.ALIGN_LEFT;
  for (const item of data.items) {
    const itemName = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    commands += ESC_POS.BOLD_ON;
    commands += `${formatTwoColumns(itemName, `[ x ${item.quantity} ]`, width)}\n`;
    commands += ESC_POS.BOLD_OFF;

    if (item.modifiers && item.modifiers.length > 0) {
      for (const mod of item.modifiers) {
        commands += `  + ${mod.name}\n`;
      }
    }
    if (item.notes) {
      commands += `  >> IZOH: ${item.notes}\n`;
    }
  }

  commands += `${formatDivider('=', width)}\n\n\n\n`;
  commands += ESC_POS.CUT_PARTIAL;

  return commands;
}
