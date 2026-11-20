import { ESC_POS, formatTwoColumns, formatDivider, formatCentered } from '../escpos.js';
import { formatCurrency } from '@oshxona/shared';

export interface ShiftReportData {
  reportType: 'X_REPORT' | 'Z_REPORT';
  reportNumber: string;
  restaurantName: string;
  branchName: string;
  cashierName: string;
  openedAt: Date;
  closedAt?: Date | null;
  startCash: number;
  // Savdolar
  salesCount: number;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  clickSales: number;
  paymeSales: number;
  debtSales: number;
  // Kassa harakatlari
  cashInflow: number;
  cashOutflow: number;
  expenses: number;
  // Qaytarishlar (Refunds)
  refundCount: number;
  refundTotal: number;
  // Yakuniy kassa balansi
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
}

export function generateShiftReportText(
  data: ShiftReportData,
  width: 58 | 80 = 80,
): string {
  const lines: string[] = [];
  const div = formatDivider('-', width);
  const doubleDiv = formatDivider('=', width);

  const title = data.reportType === 'Z_REPORT'
    ? '*** Z-HISOBOT (KASSA YOPILISHI) ***'
    : '*** X-HISOBOT (ORALIQ KO\'RISH) ***';

  lines.push(doubleDiv);
  lines.push(formatCentered(title, width));
  lines.push(formatCentered(data.restaurantName, width));
  lines.push(formatCentered(`Filial: ${data.branchName}`, width));
  lines.push(div);

  lines.push(formatTwoColumns(`Hisobot №: ${data.reportNumber}`, `Kassir: ${data.cashierName}`, width));
  lines.push(formatTwoColumns(`Ochilgan: ${data.openedAt.toLocaleTimeString('uz-UZ')}`, data.openedAt.toLocaleDateString('uz-UZ'), width));
  if (data.closedAt) {
    lines.push(formatTwoColumns(`Yopilgan: ${data.closedAt.toLocaleTimeString('uz-UZ')}`, data.closedAt.toLocaleDateString('uz-UZ'), width));
  }
  lines.push(div);

  // Boshlang'ich kassa
  lines.push(formatTwoColumns('Boshlang\'ich naqd pul:', formatCurrency(data.startCash), width));
  lines.push(div);

  // To'lov turlari bo'yicha tushum
  lines.push(formatCentered('--- SAVDO TUSHUMI (TO\'LOV TURLARI) ---', width));
  lines.push(formatTwoColumns('Buyurtmalar soni:', `${data.salesCount} ta`, width));
  lines.push(formatTwoColumns('Naqd savdo:', formatCurrency(data.cashSales), width));
  lines.push(formatTwoColumns('Karta (Uzcard/Humo):', formatCurrency(data.cardSales), width));
  lines.push(formatTwoColumns('Click to\'lovlar:', formatCurrency(data.clickSales), width));
  lines.push(formatTwoColumns('Payme to\'lovlar:', formatCurrency(data.paymeSales), width));
  lines.push(formatTwoColumns('Nasiya (Qarzga):', formatCurrency(data.debtSales), width));
  lines.push(doubleDiv);
  lines.push(formatTwoColumns('JAMI TUSHUM:', formatCurrency(data.totalSales), width));
  lines.push(div);

  // Kassa kiritish / olish / xarajat
  lines.push(formatCentered('--- KASSA HARAKATLARI ---', width));
  lines.push(formatTwoColumns('Kassaga kirim (+):', formatCurrency(data.cashInflow), width));
  lines.push(formatTwoColumns('Inkassatsiya / Chiqim (-):', formatCurrency(data.cashOutflow), width));
  lines.push(formatTwoColumns('Kassa xarajatlari (-):', formatCurrency(data.expenses), width));
  if (data.refundTotal > 0) {
    lines.push(formatTwoColumns(`Qaytarishlar (${data.refundCount} ta):`, `-${formatCurrency(data.refundTotal)}`, width));
  }
  lines.push(div);

  // Yakuniy Naqd pul tafovuti
  lines.push(formatCentered('--- NAQD PUL TAHLILI ---', width));
  lines.push(formatTwoColumns('Kutilayotgan naqd pul:', formatCurrency(data.expectedCash), width));
  if (data.actualCash !== undefined) {
    lines.push(formatTwoColumns('Haqiqiy sanalgan naqd:', formatCurrency(data.actualCash), width));
    const diff = data.cashDifference || 0;
    const diffLabel = diff >= 0 ? `Ortiqcha (+):` : `Kamomad (-):`;
    lines.push(formatTwoColumns(diffLabel, formatCurrency(diff), width));
  }
  lines.push(doubleDiv);
  lines.push(formatCentered('OshxonaPOS Tizimi', width));
  lines.push('\n\n');

  return lines.join('\n');
}

export function generateShiftReportEscPos(
  data: ShiftReportData,
  width: 58 | 80 = 80,
): string {
  let commands = '';
  commands += ESC_POS.INIT;
  commands += ESC_POS.ALIGN_CENTER;

  commands += ESC_POS.DOUBLE_ON;
  commands += `${data.reportType === 'Z_REPORT' ? 'Z-HISOBOT' : 'X-HISOBOT'}\n`;
  commands += ESC_POS.DOUBLE_OFF;

  commands += `${data.restaurantName}\n`;
  commands += `Kassir: ${data.cashierName}\n`;
  commands += `${formatDivider('-', width)}\n`;

  commands += ESC_POS.ALIGN_LEFT;
  commands += `${formatTwoColumns('Jami savdo:', formatCurrency(data.totalSales), width)}\n`;
  commands += `${formatTwoColumns('Naqd:', formatCurrency(data.cashSales), width)}\n`;
  commands += `${formatTwoColumns('Karta:', formatCurrency(data.cardSales), width)}\n`;
  commands += `${formatTwoColumns('Click/Payme:', formatCurrency(data.clickSales + data.paymeSales), width)}\n`;
  commands += `${formatTwoColumns('Nasiya:', formatCurrency(data.debtSales), width)}\n`;
  commands += `${formatDivider('-', width)}\n`;

  commands += `${formatTwoColumns('Kutilgan naqd:', formatCurrency(data.expectedCash), width)}\n`;
  if (data.actualCash !== undefined) {
    commands += ESC_POS.BOLD_ON;
    commands += `${formatTwoColumns('Haqiqiy naqd:', formatCurrency(data.actualCash), width)}\n`;
    const diff = data.cashDifference || 0;
    commands += `${formatTwoColumns('Tafovut:', formatCurrency(diff), width)}\n`;
    commands += ESC_POS.BOLD_OFF;
  }

  commands += `${formatDivider('=', width)}\n\n\n\n`;
  commands += ESC_POS.CUT_PARTIAL;

  return commands;
}
