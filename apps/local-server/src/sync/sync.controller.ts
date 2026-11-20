import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SyncWorkerService } from './sync-worker.service';

@ApiTags('Sync - Sinxronizatsiya va Status Indikatori')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncWorker: SyncWorkerService) {}

  @Get('status')
  @ApiOperation({ summary: 'Kassa indikatori uchun sinxronizatsiya holati (🟢 Online / 🟡 Syncing / 🔴 Offline)' })
  @ApiResponse({ status: 200, description: 'Sinxronizatsiya holati ma\'lumotlari' })
  async getStatus() {
    return this.syncWorker.getStatus();
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sinxronizatsiyani darhol qo\'lda ishga tushirish (Kassa yoki Admin tugmasi)' })
  async triggerSync() {
    await this.syncWorker.checkAndSync();
    return this.syncWorker.getStatus();
  }
}
