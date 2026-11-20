/**
 * O'zbekiston Davlat Soliq Qo'mitasi Onlayn-KKM / Virtual kassa integratsiyasi uchun
 * Fiskal Adapter Interfeysi (Adapter Pattern)
 */

export interface FiscalReceiptItem {
  name: string;
  spicCode?: string; // MXIK kodi (masalan 10701001001000000)
  packageCode?: string; // Qadoq kodi
  quantity: number;
  price: number; // Tiyinsiz so'm
  totalPrice: number;
  vatPercent: number; // QQS foizi (masalan 12% yoki 0%)
}

export interface FiscalReceiptRequest {
  receiptNumber: string;
  dateTime: Date;
  cashierName: string;
  items: FiscalReceiptItem[];
  totalAmount: number;
  cashAmount: number;
  cardAmount: number;
  qrCodeUrl?: string;
  fiscalSign?: string;
}

export interface FiscalReceiptResult {
  success: boolean;
  fiscalSign: string;
  qrCodeUrl: string;
  terminalId?: string;
  receiptSeqNumber?: string;
  errorMessage?: string;
}

export interface IFiscalAdapter {
  readonly name: string;
  registerSale(data: FiscalReceiptRequest): Promise<FiscalReceiptResult>;
  registerRefund(data: FiscalReceiptRequest): Promise<FiscalReceiptResult>;
  openShift(): Promise<boolean>;
  closeShift(): Promise<{ zReportNumber: string; totalSales: number }>;
}

/**
 * Standart Dummy (Emulyator) adapter (Productionda haqiqiy fiskal SDK bilan almashtiriladi)
 */
export class DummyFiscalAdapter implements IFiscalAdapter {
  readonly name = 'DUMMY_FISCAL_EMULATOR';

  async registerSale(data: FiscalReceiptRequest): Promise<FiscalReceiptResult> {
    return {
      success: true,
      fiscalSign: `FS-${Date.now().toString(36).toUpperCase()}`,
      qrCodeUrl: `https://ofd.soliq.uz/check?id=${data.receiptNumber}`,
      terminalId: 'TERM-001',
      receiptSeqNumber: '0001',
    };
  }

  async registerRefund(data: FiscalReceiptRequest): Promise<FiscalReceiptResult> {
    return {
      success: true,
      fiscalSign: `REFUND-${Date.now().toString(36).toUpperCase()}`,
      qrCodeUrl: `https://ofd.soliq.uz/refund?id=${data.receiptNumber}`,
    };
  }

  async openShift(): Promise<boolean> {
    return true;
  }

  async closeShift(): Promise<{ zReportNumber: string; totalSales: number }> {
    return {
      zReportNumber: `Z-${Date.now()}`,
      totalSales: 0,
    };
  }
}
