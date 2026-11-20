import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { KdsController } from './kds.controller';

@Module({
  controllers: [OrdersController, KdsController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
