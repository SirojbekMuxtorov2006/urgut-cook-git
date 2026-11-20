import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Halls & Tables - Zallar va Stollar Xaritasi')
@Controller()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('halls')
  @ApiOperation({ summary: 'Barcha zallar va stollar xaritasi (ochiq buyurtmalari bilan)' })
  @ApiResponse({ status: 200, description: 'Zallar va stollar ro\'yxati' })
  async getHalls(@CurrentUser('branchId') branchId?: string) {
    const targetBranchId = branchId || '019349c2-5500-7000-8000-000000000001';
    return this.tablesService.getHallsWithTables(targetBranchId);
  }

  @Get('tables/:id')
  @ApiOperation({ summary: 'Stol tafsilotlari va uning joriy buyurtmasi' })
  async getTable(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Patch('tables/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stol holatini yangilash (bo\'sh, band, to\'lov kutilmoqda)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, dto.status);
  }

  @Patch('tables/:id/position')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stol koordinatasini o\'zgartirish (stollar xaritasi muharriri)' })
  async updatePosition(
    @Param('id') id: string,
    @Body() body: { posX: number; posY: number },
  ) {
    return this.tablesService.updatePosition(id, body.posX, body.posY);
  }
}
