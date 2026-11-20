import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TableStatus } from '@prisma/client';

export class UpdateTableStatusDto {
  @ApiProperty({ enum: TableStatus, example: TableStatus.OCCUPIED, description: 'Stolning yangi holati' })
  @IsEnum(TableStatus, { message: 'Noto\'g\'ri stol holati (VACANT, OCCUPIED, PAYMENT_PENDING, RESERVED)' })
  @IsNotEmpty()
  status: TableStatus;
}
