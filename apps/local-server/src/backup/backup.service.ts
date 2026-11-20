import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger('BackupService');
  private backupDir = path.resolve(process.cwd(), 'backups');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Barcha jadvallarning zaxira nusxasini (Snapshot) yaratish
   */
  async createBackup(): Promise<{ filename: string; size: number; createdAt: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `oshxona_backup_${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    this.logger.log(`💾 Zaxira nusxa yaratilmoqda: ${filename}...`);

    // Asosiy jadvallar ma'lumotlarini yig'ish
    const [
      branches,
      users,
      categories,
      menuItems,
      ingredients,
      recipes,
      halls,
      tables,
      orders,
      payments,
      shifts,
      customers,
      settings,
    ] = await Promise.all([
      this.prisma.branch.findMany(),
      this.prisma.user.findMany(),
      this.prisma.category.findMany(),
      this.prisma.menuItem.findMany(),
      this.prisma.ingredient.findMany(),
      this.prisma.recipe.findMany({ include: { items: true } }),
      this.prisma.hall.findMany(),
      this.prisma.table.findMany(),
      this.prisma.order.findMany({ include: { items: true } }),
      this.prisma.payment.findMany(),
      this.prisma.shift.findMany(),
      this.prisma.customer.findMany(),
      this.prisma.setting.findMany(),
    ]);

    const backupData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      database: 'PostgreSQL',
      data: {
        branches,
        users,
        categories,
        menuItems,
        ingredients,
        recipes,
        halls,
        tables,
        orders,
        payments,
        shifts,
        customers,
        settings,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filepath, jsonString, 'utf-8');

    const stats = fs.statSync(filepath);
    this.logger.log(`✅ Zaxira nusxa muvaffaqiyatli saqlandi (${Math.round(stats.size / 1024)} KB)`);

    return {
      filename,
      size: stats.size,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Mavjud zaxira nusxalar ro'yxati
   */
  listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];

    const files = fs.readdirSync(this.backupDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const fullPath = path.join(this.backupDir, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          sizeKb: Math.round(stats.size / 1024),
          createdAt: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
