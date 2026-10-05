import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import {
  DEFAULT_DEBT_REMINDER_DAYS,
} from '../utils/customer';
import {
  getCachedAt,
  getLastSyncAt,
  getOutbox,
} from './localStore';
import { useNetworkStatus } from './network';
import { flushOutbox } from './syncWorker';
import type { OutboxSaleItem } from './types';
import { warmShopCache } from './warmCache';

type OfflineContextValue = {
  isOnline: boolean;
  networkReady: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
  cachedAt: string | null;
  outbox: OutboxSaleItem[];
  refreshOfflineState: () => Promise<void>;
  syncNow: () => Promise<{ synced: number; failed: number }>;
  /** Require network; returns false and caller should toast if offline */
  requireOnline: () => boolean;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { shopId, profile } = useAuth();
  const { isOnline, ready: networkReady } = useNetworkStatus();
  const [outbox, setOutboxState] = useState<OutboxSaleItem[]>([]);
  const [lastSyncAt, setLastSyncAtState] = useState<string | null>(null);
  const [cachedAt, setCachedAtState] = useState<string | null>(null);
  const reminderDays =
    profile?.debt_reminder_days ?? DEFAULT_DEBT_REMINDER_DAYS;

  const refreshOfflineState = useCallback(async () => {
    if (!shopId) {
      setOutboxState([]);
      setLastSyncAtState(null);
      setCachedAtState(null);
      return;
    }
    const [box, syncAt, cacheAt] = await Promise.all([
      getOutbox(shopId),
      getLastSyncAt(shopId),
      getCachedAt(shopId),
    ]);
    setOutboxState(box);
    setLastSyncAtState(syncAt);
    setCachedAtState(cacheAt);
  }, [shopId]);

  const syncNow = useCallback(async () => {
    if (!shopId) return { synced: 0, failed: 0 };
    const result = await flushOutbox(shopId);
    await refreshOfflineState();
    return result;
  }, [shopId, refreshOfflineState]);

  useEffect(() => {
    void refreshOfflineState();
  }, [refreshOfflineState]);

  // Warm product/customer cache whenever we’re online so Record Sale works offline.
  useEffect(() => {
    if (!shopId || !isOnline) return;
    void (async () => {
      await warmShopCache(shopId, reminderDays);
      await refreshOfflineState();
      await syncNow();
    })();
  }, [shopId, isOnline, reminderDays]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active' && shopId && isOnline) {
        void (async () => {
          await warmShopCache(shopId, reminderDays);
          await refreshOfflineState();
          await syncNow();
        })();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [shopId, isOnline, reminderDays, refreshOfflineState, syncNow]);

  const pendingCount = outbox.filter(
    i => i.status === 'pending' || i.status === 'syncing',
  ).length;
  const failedCount = outbox.filter(i => i.status === 'failed').length;

  const requireOnline = useCallback(() => isOnline, [isOnline]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      isOnline,
      networkReady,
      pendingCount,
      failedCount,
      lastSyncAt,
      cachedAt,
      outbox,
      refreshOfflineState,
      syncNow,
      requireOnline,
    }),
    [
      isOnline,
      networkReady,
      pendingCount,
      failedCount,
      lastSyncAt,
      cachedAt,
      outbox,
      refreshOfflineState,
      syncNow,
      requireOnline,
    ],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return ctx;
}

/** Safe optional access when provider may be outside auth tree during splash. */
export function useOfflineOptional() {
  return useContext(OfflineContext);
}
