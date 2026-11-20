import { UserRole, DeviceType } from './enums.js';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  version: number;
  syncedAt?: Date | null;
  deviceId?: string | null;
}

export interface JwtPayload {
  sub: string;
  username?: string;
  role: UserRole;
  branchId: string;
  deviceId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username?: string | null;
    fullName: string;
    role: UserRole;
    discountLimit: number;
    branchId: string;
  };
}

export interface SyncPayload {
  entity: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  deviceId: string;
  version: number;
  timestamp: string;
}

export interface SyncPushRequest {
  deviceId: string;
  items: SyncPayload[];
}

export interface SyncPullResponse {
  lastPulledAt: string;
  items: SyncPayload[];
}
