import type { CreateSaleInput } from '../features/sales/hooks/useCreateSale';
import {
  applyOptimisticStock,
  getOutbox,
  restoreOptimisticStock,
  setOutbox,
} from './localStore';
import type { OutboxSaleItem, PendingSalePayload } from './types';

function newClientSaleId(): string {
  const cryptoApi = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string };
  };
  if (cryptoApi.crypto?.randomUUID) return cryptoApi.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function enqueueSale(
  shopId: string,
  payload: PendingSalePayload,
): Promise<OutboxSaleItem> {
  const item: OutboxSaleItem = {
    clientSaleId: newClientSaleId(),
    shopId,
    createdAt: new Date().toISOString(),
    status: 'pending',
    payload,
    retries: 0,
    stockHeld: true,
  };

  const current = await getOutbox(shopId);
  await setOutbox(shopId, [item, ...current]);
  await applyOptimisticStock(
    shopId,
    payload.items.map(i => ({
      productId: i.product_id,
      quantity: i.quantity,
    })),
  );
  return item;
}

export async function updateOutboxItem(
  shopId: string,
  clientSaleId: string,
  patch: Partial<OutboxSaleItem>,
): Promise<void> {
  const current = await getOutbox(shopId);
  await setOutbox(
    shopId,
    current.map(item =>
      item.clientSaleId === clientSaleId ? { ...item, ...patch } : item,
    ),
  );
}

export async function removeOutboxItem(
  shopId: string,
  clientSaleId: string,
): Promise<void> {
  const current = await getOutbox(shopId);
  await setOutbox(
    shopId,
    current.filter(item => item.clientSaleId !== clientSaleId),
  );
}

export async function markOutboxFailed(
  shopId: string,
  clientSaleId: string,
  error: string,
  restoreStock: boolean,
): Promise<void> {
  const current = await getOutbox(shopId);
  const item = current.find(i => i.clientSaleId === clientSaleId);
  if (!item) return;

  const held = item.stockHeld ?? item.status !== 'failed';
  if (restoreStock && held) {
    await restoreOptimisticStock(
      shopId,
      item.payload.items.map(i => ({
        productId: i.product_id,
        quantity: i.quantity,
      })),
    );
  }

  await updateOutboxItem(shopId, clientSaleId, {
    status: 'failed',
    lastError: error,
    retries: item.retries + 1,
    stockHeld: restoreStock ? false : held,
  });
}

/** Put a failed/pending outbox sale back in the queue for another sync attempt. */
export async function requeueOutboxItem(
  shopId: string,
  clientSaleId: string,
): Promise<boolean> {
  const item = await getOutboxItem(shopId, clientSaleId);
  if (!item) return false;
  await updateOutboxItem(shopId, clientSaleId, {
    status: 'pending',
    retries: 0,
    lastError: undefined,
  });
  return true;
}

/**
 * Remove a local-only sale from the phone.
 * Restores stock if this outbox entry still holds it.
 */
export async function discardOutboxSale(
  shopId: string,
  clientSaleId: string,
): Promise<boolean> {
  const item = await getOutboxItem(shopId, clientSaleId);
  if (!item) return false;

  // Older failed items (before stockHeld) usually already restored stock.
  const held = item.stockHeld ?? item.status !== 'failed';
  if (held) {
    await restoreOptimisticStock(
      shopId,
      item.payload.items.map(i => ({
        productId: i.product_id,
        quantity: i.quantity,
      })),
    );
  }

  await removeOutboxItem(shopId, clientSaleId);
  return true;
}

export function toCreateSaleInput(payload: PendingSalePayload): CreateSaleInput {
  return {
    customerId: payload.customerId,
    paymentStatus: payload.paymentStatus,
    paymentMethod: payload.paymentMethod,
    amountPaid: payload.amountPaid,
    items: payload.items,
  };
}

export async function listPendingSales(
  shopId: string,
): Promise<OutboxSaleItem[]> {
  const items = await getOutbox(shopId);
  return items.filter(i => i.status === 'pending' || i.status === 'syncing');
}

export async function listFailedSales(
  shopId: string,
): Promise<OutboxSaleItem[]> {
  const items = await getOutbox(shopId);
  return items.filter(i => i.status === 'failed');
}

export async function getOutboxItem(
  shopId: string,
  clientSaleId: string,
): Promise<OutboxSaleItem | null> {
  const items = await getOutbox(shopId);
  return items.find(i => i.clientSaleId === clientSaleId) ?? null;
}
