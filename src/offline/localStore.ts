import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '../types/domain';
import type { CustomerLedgerRow } from '../features/customers/hooks/useCustomerLedger';
import type { OutboxSaleItem, ShopCacheSnapshot } from './types';

function productsKey(shopId: string) {
  return `sb:offline:${shopId}:products`;
}
function customersKey(shopId: string) {
  return `sb:offline:${shopId}:customers`;
}
function cachedAtKey(shopId: string) {
  return `sb:offline:${shopId}:cachedAt`;
}
function outboxKey(shopId: string) {
  return `sb:offline:${shopId}:outbox`;
}
function lastSyncKey(shopId: string) {
  return `sb:offline:${shopId}:lastSyncAt`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getCachedProducts(shopId: string): Promise<Product[]> {
  return readJson<Product[]>(productsKey(shopId), []);
}

export async function setCachedProducts(
  shopId: string,
  products: Product[],
): Promise<void> {
  await writeJson(productsKey(shopId), products);
  await AsyncStorage.setItem(cachedAtKey(shopId), new Date().toISOString());
}

export async function getCachedCustomers(
  shopId: string,
): Promise<CustomerLedgerRow[]> {
  return readJson<CustomerLedgerRow[]>(customersKey(shopId), []);
}

export async function setCachedCustomers(
  shopId: string,
  customers: CustomerLedgerRow[],
): Promise<void> {
  await writeJson(customersKey(shopId), customers);
  await AsyncStorage.setItem(cachedAtKey(shopId), new Date().toISOString());
}

export async function getCachedAt(shopId: string): Promise<string | null> {
  return AsyncStorage.getItem(cachedAtKey(shopId));
}

export async function getShopSnapshot(
  shopId: string,
): Promise<ShopCacheSnapshot> {
  const [products, customers, cachedAt] = await Promise.all([
    getCachedProducts(shopId),
    getCachedCustomers(shopId),
    getCachedAt(shopId),
  ]);
  return { products, customers, cachedAt };
}

/** Apply optimistic stock decreases after an offline sale. */
export async function applyOptimisticStock(
  shopId: string,
  deltas: { productId: string; quantity: number }[],
): Promise<Product[]> {
  const products = await getCachedProducts(shopId);
  const next = products.map(p => {
    const hit = deltas.find(d => d.productId === p.id);
    if (!hit) return p;
    return {
      ...p,
      quantity: Math.max(0, p.quantity - hit.quantity),
      updated_at: new Date().toISOString(),
    };
  });
  await setCachedProducts(shopId, next);
  return next;
}

/** Restore stock when a pending sale fails permanently. */
export async function restoreOptimisticStock(
  shopId: string,
  deltas: { productId: string; quantity: number }[],
): Promise<void> {
  const products = await getCachedProducts(shopId);
  const next = products.map(p => {
    const hit = deltas.find(d => d.productId === p.id);
    if (!hit) return p;
    return {
      ...p,
      quantity: p.quantity + hit.quantity,
      updated_at: new Date().toISOString(),
    };
  });
  await setCachedProducts(shopId, next);
}

export async function getOutbox(shopId: string): Promise<OutboxSaleItem[]> {
  return readJson<OutboxSaleItem[]>(outboxKey(shopId), []);
}

export async function setOutbox(
  shopId: string,
  items: OutboxSaleItem[],
): Promise<void> {
  await writeJson(outboxKey(shopId), items);
}

export async function getLastSyncAt(shopId: string): Promise<string | null> {
  return AsyncStorage.getItem(lastSyncKey(shopId));
}

export async function setLastSyncAt(
  shopId: string,
  iso: string,
): Promise<void> {
  await AsyncStorage.setItem(lastSyncKey(shopId), iso);
}
