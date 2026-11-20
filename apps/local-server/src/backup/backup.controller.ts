import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Backup - Zaxira Nusxalash va Xavfsizlik (Admin)')
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  @ApiOperation({ summary: 'Bazaning to\'liq zaxira nusxasini yaratish (Backup)' })
  @ApiResponse({ status: 201, description: 'Zaxira nusxa yaratildi' })
  async createBackup() {
    return this.backupService.createBackup();
  }

  @Get('list')
  @ApiOperation({ summary: 'Mavjud barcha zaxira nusxalar ro\'yxati' })
  async listBackups() {
    return this.backupService.listBackups();
  }
}
