import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getOutbox } from '../../../offline/localStore';
import { useOfflineOptional } from '../../../offline/OfflineContext';
import {
  DEFAULT_DEBT_REMINDER_DAYS,
  daysSince,
  debtFollowUpCycle,
  isDebtOverdue,
} from '../../../utils/customer';
import { formatNaira } from '../../../utils/money';

export type NotificationKind = 'low_stock' | 'debt' | 'sync';

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  fingerprint: string;
  occurredAt: string;
  owedAmount?: number;
  productId?: string;
  customerId?: string;
};

export type NotificationsData = {
  items: NotificationItem[];
  lowStockCount: number;
  debtCount: number;
  syncCount: number;
};

export function useNotifications() {
  const { profile, shopId } = useAuth();
  const offline = useOfflineOptional();
  const threshold = profile?.low_stock_threshold ?? 5;
  const reminderDays = profile?.debt_reminder_days ?? DEFAULT_DEBT_REMINDER_DAYS;

  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey(key => key + 1), []);

  useEffect(() => {
    if (!shopId) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      const outbox = await getOutbox(shopId);
      const syncItems: NotificationItem[] = outbox
        .filter(i => i.status === 'failed')
        .map(i => ({
          id: `sync-${i.clientSaleId}`,
          kind: 'sync' as const,
          title: `Sale ${formatNaira(i.payload.totalAmount)} didn’t sync`,
          detail: i.lastError?.slice(0, 80) || 'Sync conflict',
          fingerprint: `fail:${i.retries}:${i.lastError ?? ''}`,
          occurredAt: i.createdAt,
        }));

      const [debtsRes, productsRes] = await Promise.all([
        supabase
          .from('debts')
          .select(
            'id, amount_owed, amount_paid, status, created_at, customer_id, customer:customers(id, name)',
          )
          .eq('user_id', shopId)
          .eq('status', 'open')
          .order('created_at', { ascending: true }),
        supabase
          .from('products')
          .select('id, name, quantity, low_stock_threshold, updated_at')
          .eq('user_id', shopId)
          .eq('is_active', true),
      ]);

      if (cancelled) return;

      // Offline: still show sync notes even if debts/products fail
      const lowStock: NotificationItem[] = !(productsRes.error)
        ? (productsRes.data ?? [])
            .filter(p => {
              const limit = p.low_stock_threshold ?? threshold;
              return p.quantity <= limit;
            })
            .sort((a, b) => a.quantity - b.quantity)
            .map(p => ({
              id: `stock-${p.id}`,
              kind: 'low_stock' as const,
              title: `${p.name} — ${p.quantity} left`,
              detail: 'Low stock',
              fingerprint: `qty:${p.quantity}`,
              occurredAt: p.updated_at,
              productId: p.id,
            }))
        : [];

      const followUps: NotificationItem[] = [];
      if (!debtsRes.error) {
        for (const d of debtsRes.data ?? []) {
          const customer = d.customer as
            | { id: string; name: string }
            | { id: string; name: string }[]
            | null;
          const customerRow = Array.isArray(customer) ? customer[0] : customer;
          const customerId = d.customer_id ?? customerRow?.id ?? undefined;
          const name = customerRow?.name?.trim() || 'Customer';
          const owed = Math.max(
            0,
            Number(d.amount_owed) - Number(d.amount_paid),
          );
          const days = daysSince(d.created_at);
          const cycle = debtFollowUpCycle(days, reminderDays);
          if (!isDebtOverdue(days, reminderDays) || owed <= 0) continue;

          followUps.push({
            id: `debt-${d.id}`,
            kind: 'debt',
            title: `${name}'s debt hit ${days} day${days === 1 ? '' : 's'}`,
            detail: 'Follow up',
            fingerprint: `followup:${cycle}:owed:${Math.round(owed)}`,
            occurredAt: d.created_at,
            owedAmount: owed,
            customerId,
          });
        }
      }

      followUps.sort(
        (a, b) => daysSince(b.occurredAt) - daysSince(a.occurredAt),
      );

      if (debtsRes.error && productsRes.error && syncItems.length === 0) {
        setError(
          debtsRes.error?.message ?? productsRes.error?.message ?? 'Failed',
        );
        setLoading(false);
        return;
      }

      const items = [...syncItems, ...lowStock, ...followUps].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      );

      setData({
        items,
        lowStockCount: lowStock.length,
        debtCount: followUps.length,
        syncCount: syncItems.length,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    shopId,
    threshold,
    reminderDays,
    reloadKey,
    offline?.failedCount,
    offline?.pendingCount,
  ]);

  return { data, loading, error, refresh };
}
