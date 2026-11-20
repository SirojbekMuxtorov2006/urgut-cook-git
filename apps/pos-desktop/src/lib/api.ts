export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  createdAt: string;
  label: string;
  retries: number;
}

const DEFAULT_API_BASE = 'http://localhost:4000/api';
const QUEUE_STORAGE_KEY = 'oshxona_pos_sync_queue_v1';
const API_URL_STORAGE_KEY = 'oshxona_pos_api_url_v1';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_API_BASE;
  return localStorage.getItem(API_URL_STORAGE_KEY) || DEFAULT_API_BASE;
}

export function setApiBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_URL_STORAGE_KEY, url.replace(/\/+$/, ''));
  }
}

export function loadSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

export function saveSyncQueue(queue: SyncQueueItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }
}

export function enqueueOfflineAction(
  endpoint: string,
  method: SyncQueueItem['method'],
  body: unknown,
  label: string,
): SyncQueueItem[] {
  const queue = loadSyncQueue();
  const next: SyncQueueItem[] = [
    ...queue,
    {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      endpoint,
      method,
      body,
      createdAt: new Date().toISOString(),
      label,
      retries: 0,
    },
  ];
  saveSyncQueue(next);
  return next;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 3500,
): Promise<{ ok: true; data: T } | { ok: false; error: string; offline: boolean }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, error: 'Internet yoki lokal server aloqasi yo\'q', offline: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: errData.message || `HTTP ${res.status}`,
        offline: false,
      };
    }

    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Tarmoq xatoligi';
    return { ok: false, error: msg, offline: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function flushSyncQueue(): Promise<{
  remaining: SyncQueueItem[];
  syncedCount: number;
  lastError: string | null;
}> {
  const queue = loadSyncQueue();
  if (queue.length === 0) {
    return { remaining: [], syncedCount: 0, lastError: null };
  }

  const remaining: SyncQueueItem[] = [];
  let syncedCount = 0;
  let lastError: string | null = null;

  for (const item of queue) {
    const result = await apiRequest(item.endpoint, {
      method: item.method,
      body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
    });

    if (result.ok) {
      syncedCount += 1;
    } else {
      lastError = result.error;
      remaining.push({ ...item, retries: item.retries + 1 });
      if (result.offline) {
        // Stop trying further items while offline
        const idx = queue.indexOf(item);
        remaining.push(...queue.slice(idx + 1));
        break;
      }
    }
  }

  saveSyncQueue(remaining);
  return { remaining, syncedCount, lastError };
}

export async function printReceiptNative(payload: string): Promise<{ printed: boolean; mode: 'electron' | 'browser' }> {
  try {
    const win = window as unknown as {
      require?: (mod: string) => { ipcRenderer?: { invoke: (ch: string, data: string) => Promise<{ success: boolean }> } };
      electronAPI?: { printReceipt: (data: string) => Promise<{ success: boolean }> };
    };

    if (win.electronAPI?.printReceipt) {
      await win.electronAPI.printReceipt(payload);
      return { printed: true, mode: 'electron' };
    }

    if (typeof win.require === 'function') {
      const electron = win.require('electron');
      if (electron?.ipcRenderer) {
        await electron.ipcRenderer.invoke('print-receipt', payload);
        return { printed: true, mode: 'electron' };
      }
    }
  } catch {
    // Fallback to browser print
  }

  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
  return { printed: true, mode: 'browser' };
}
