import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { SyncModule } from './sync/sync.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuModule } from './menu/menu.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CustomersModule } from './customers/customers.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ShiftsModule } from './shifts/shifts.module';
import { StockModule } from './stock/stock.module';
import { ReportsModule } from './reports/reports.module';
import { TelegramModule } from './telegram/telegram.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    SyncModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    MenuModule,
    TablesModule,
    OrdersModule,
    PaymentsModule,
    CustomersModule,
    ReceiptsModule,
    ShiftsModule,
    StockModule,
    ReportsModule,
    TelegramModule,
    BackupModule,
  ],
})
export class AppModule {}
