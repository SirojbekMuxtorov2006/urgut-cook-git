import { Global, Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { SyncWorkerService } from './sync-worker.service';
import { SyncController } from './sync.controller';

@Global()
@Module({
  controllers: [SyncController],
  providers: [OutboxService, SyncWorkerService],
  exports: [OutboxService, SyncWorkerService],
})
export class SyncModule {}
