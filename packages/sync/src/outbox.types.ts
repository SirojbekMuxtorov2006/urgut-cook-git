import { SyncOperation, SyncStatus } from '@oshxona/shared';

export interface OutboxItem {
  id: string;
  branchId: string;
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  attempts: number;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deviceId?: string | null;
  version: number;
}

export interface SyncPushBatch {
  deviceId: string;
  branchId: string;
  items: {
    id: string;
    entity: string;
    entityId: string;
    operation: SyncOperation;
    payload: Record<string, unknown>;
    version: number;
    updatedAt: string;
  }[];
}

export interface SyncPushResult {
  processedIds: string[];
  failedIds: { id: string; error: string }[];
}

export interface SyncPullResult {
  lastPulledAt: string;
  changes: {
    entity: string;
    entityId: string;
    operation: SyncOperation;
    payload: Record<string, unknown>;
    updatedAt: string;
    version: number;
  }[];
}

export interface SyncStatusSummary {
  isOnline: boolean;
  lastHeartbeat: string;
  pendingCount: number;
  failedCount: number;
  lastSuccessfulSyncAt?: string | null;
  lastError?: string | null;
}
