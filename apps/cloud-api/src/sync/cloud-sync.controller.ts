import { Controller, Post, Get, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { CloudSyncService } from './cloud-sync.service';
import { SyncPushBatch } from '@oshxona/sync';

@ApiTags('Cloud Sync - Bulut Sinxronizatsiyasi')
@Controller('sync')
export class CloudSyncController {
  constructor(private readonly syncService: CloudSyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Lokal serverdan o\'zgarishlar paketini qabul qilish (Push)' })
  @ApiHeader({ name: 'x-api-key', required: true, description: 'Lokal server API kaliti' })
  async push(
    @Body() batch: SyncPushBatch,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey);
    return this.syncService.handlePush(batch);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Bulutdagi eng so\'nggi o\'zgarishlarni yuklab olish (Pull)' })
  @ApiHeader({ name: 'x-api-key', required: true })
  async pull(
    @Query('branchId') branchId: string,
    @Query('since') since?: string,
    @Headers('x-api-key') apiKey?: string,
  ) {
    this.validateApiKey(apiKey);
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.syncService.handlePull(targetBranchId, since);
  }

  @Get('status')
  @ApiOperation({ summary: 'Bulut server holati' })
  async status() {
    return {
      status: 'ONLINE',
      cloudTime: new Date().toISOString(),
      service: 'OshxonaPOS Cloud API v1.0',
    };
  }

  private validateApiKey(apiKey?: string) {
    const validKey = process.env.CLOUD_API_KEY || 'oshxona-pos-cloud-api-sync-key';
    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('API kalit yaroqsiz yoki ko\'rsatilmagan');
    }
  }
}
