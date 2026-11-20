import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MergeOrdersDto {
  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000701', description: 'Qo\'shilayotgan (yopiladigan) buyurtma IDsi' })
  @IsString()
  @IsNotEmpty()
  sourceOrderId: string;

  @ApiProperty({ example: '019349c2-5500-7000-8000-000000000702', description: 'Asosiy (birlashtiriladigan) buyurtma IDsi' })
  @IsString()
  @IsNotEmpty()
  targetOrderId: string;
}
