import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatCurrency } from '@oshxona/shared';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger('TelegramService');
  private botToken = process.env.TELEGRAM_BOT_TOKEN;
  private adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (this.botToken && this.adminChatId) {
      this.logger.log('🤖 Telegram Admin Boti faollashtirildi');
    } else {
      this.logger.log('ℹ️ Telegram Bot sozlanmagan (TELEGRAM_BOT_TOKEN va TELEGRAM_ADMIN_CHAT_ID .env da ko\'rsatilmagan)');
    }
  }

  /**
   * Telegramga xabar yuborish
   */
  async sendMessage(text: string, chatId?: string) {
    const targetChat = chatId || this.adminChatId;
    if (!this.botToken || !targetChat) return;

    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChat,
          text,
          parse_mode: 'HTML',
        }),
      });
    } catch (e: any) {
      this.logger.error(`Telegram xabar yuborishda xato: ${e.message}`);
    }
  }

  /**
   * Z-Hisobot xabarnomasi (Smena yopilganda adminga boradi)
   */
  async notifyZReport(zReportData: any) {
    const msg = `
🧾 <b>YANGI Z-HISOBOT (KASSA YOPILDI)</b>
━━━━━━━━━━━━━━━━━━
<b>Filial:</b> ${zReportData.branchName}
<b>Kassir:</b> ${zReportData.cashierName}
<b>Smena:</b> #${zReportData.reportNumber}
<b>Vaqt:</b> ${new Date().toLocaleTimeString('uz-UZ')}

💰 <b>Jami Savdo:</b> ${formatCurrency(zReportData.totalSales)}
💵 Naqd: ${formatCurrency(zReportData.cashSales)}
💳 Karta: ${formatCurrency(zReportData.cardSales)}
📱 Click/Payme: ${formatCurrency(zReportData.clickSales + zReportData.paymeSales)}
📖 Nasiya: ${formatCurrency(zReportData.debtSales)}
━━━━━━━━━━━━━━━━━━
💵 <b>Kutilgan Naqd:</b> ${formatCurrency(zReportData.expectedCash)}
🔢 <b>Haqiqiy Sanalgan:</b> ${formatCurrency(zReportData.actualCash)}
⚖️ <b>Tafovut:</b> ${zReportData.cashDifference >= 0 ? '+' : ''}${formatCurrency(zReportData.cashDifference)}
    `.trim();

    await this.sendMessage(msg);
  }

  /**
   * Ombor qoldig'i kritik darajadan kam qolganda ogohlantirish
   */
  async notifyLowStock(ingredient: any) {
    const msg = `
⚠️ <b>DIQQAT: OMBORDA MAHSULOT KAM QOLDI!</b>
━━━━━━━━━━━━━━━━━━
<b>Xomashyo:</b> ${ingredient.name}
<b>Mavjud qoldiq:</b> ${ingredient.currentQty} ${ingredient.unit}
<b>Minimal chegara:</b> ${ingredient.minQty} ${ingredient.unit}
<i>Iltimos, zudlik bilan yangi partiya xarid qiling!</i>
    `.trim();

    await this.sendMessage(msg);
  }

  /**
   * To'lov qaytarilganda (Refund) ogohlantirish
   */
  async notifyRefund(orderNumber: string, amount: number, reason: string, approvedBy: string) {
    const msg = `
🚨 <b>TO'LOV QAYTARILDI (REFUND)</b>
━━━━━━━━━━━━━━━━━━
<b>Buyurtma №:</b> ${orderNumber}
<b>Qaytarilgan Summa:</b> ${formatCurrency(amount)}
<b>Sababi:</b> ${reason}
<b>Tasdiqladi Admin:</b> ${approvedBy}
    `.trim();

    await this.sendMessage(msg);
  }
}
