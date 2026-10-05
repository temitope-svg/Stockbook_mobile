import { createSale } from '../features/sales/hooks/useCreateSale';
import {
  getOutbox,
  setCachedProducts,
  setLastSyncAt,
} from './localStore';
import { fetchIsOnline } from './network';
import {
  markOutboxFailed,
  removeOutboxItem,
  requeueOutboxItem,
  toCreateSaleInput,
  updateOutboxItem,
} from './outbox';
import { supabase } from '../lib/supabase';

const PRODUCT_COLUMNS =
  'id, user_id, name, category, cost_price, selling_price, quantity, low_stock_threshold, image_url, imei, condition, variant, custom_fields, is_active, created_at, updated_at';

function isRetryableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('network') ||
    m.includes('fetch') ||
    m.includes('timeout') ||
    m.includes('offline') ||
    m.includes('failed to fetch')
  );
}

function isStockConflict(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('not enough stock') || m.includes('stock');
}

function isMissingSaleRpc(message: string): boolean {
  return (
    message.includes('Could not find the function') &&
    message.includes('create_sale')
  );
}

export function humanizeSyncError(message: string): string {
  if (isMissingSaleRpc(message)) {
    return 'Server needs an update — run stockbook-create-sale-client-id-migration.sql in Supabase SQL Editor, then tap Retry sync.';
  }
  return message;
}

export type FlushResult = {
  synced: number;
  failed: number;
};

/** Drain pending sales for a shop. Safe to call often (skips if offline). */
export async function flushOutbox(shopId: string): Promise<FlushResult> {
  const online = await fetchIsOnline();
  if (!online) return { synced: 0, failed: 0 };

  const items = (await getOutbox(shopId))
    .filter(i => i.status === 'pending' || i.status === 'failed')
    // Failed items can be retried manually via flush; pending first (FIFO by createdAt)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    // Auto-flush skips exhausted failures; use forceRetryOutboxItem to try again.
    if (item.status === 'failed' && item.retries >= 5) {
      continue;
    }

    await updateOutboxItem(shopId, item.clientSaleId, { status: 'syncing' });

    try {
      const serverSaleId = await createSale(
        toCreateSaleInput(item.payload),
        item.clientSaleId,
      );
      await removeOutboxItem(shopId, item.clientSaleId);
      synced += 1;
      void serverSaleId;
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Sync failed';
      const msg = humanizeSyncError(raw);
      if (isStockConflict(raw)) {
        // Real stock conflict — put units back on the phone.
        await markOutboxFailed(shopId, item.clientSaleId, msg, true);
        failed += 1;
      } else if (isMissingSaleRpc(raw) || !isRetryableError(raw)) {
        // Keep local stock reserved; sale can retry after DB/migration fix.
        await markOutboxFailed(shopId, item.clientSaleId, msg, false);
        failed += 1;
      } else {
        await updateOutboxItem(shopId, item.clientSaleId, {
          status: 'pending',
          lastError: msg,
          retries: item.retries + 1,
        });
      }
    }
  }

  // Refresh product snapshot from server after any successful sync
  if (synced > 0) {
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('user_id', shopId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (data) {
      await setCachedProducts(shopId, data);
    }
    await setLastSyncAt(shopId, new Date().toISOString());
  }

  return { synced, failed };
}

/** Reset a stuck outbox sale and try syncing it again. */
export async function forceRetryOutboxItem(
  shopId: string,
  clientSaleId: string,
): Promise<FlushResult> {
  const queued = await requeueOutboxItem(shopId, clientSaleId);
  if (!queued) return { synced: 0, failed: 0 };
  return flushOutbox(shopId);
}
