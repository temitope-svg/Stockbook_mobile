import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  DEFAULT_DEBT_REMINDER_DAYS,
  daysSince,
  isDebtOverdue,
} from '../../../utils/customer';
import { formatNaira } from '../../../utils/money';

export type AttentionKind = 'low_stock' | 'debt';

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  title: string;
  detail: string;
  detailTone: 'danger' | 'muted';
  productId?: string;
  customerId?: string;
};

export function useAttentionItems() {
  const { profile, shopId } = useAuth();
  const threshold = profile?.low_stock_threshold ?? 5;
  const reminderDays = profile?.debt_reminder_days ?? DEFAULT_DEBT_REMINDER_DAYS;

  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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

    const lowStock: AttentionItem[] = (productsRes.data ?? [])
      .filter(p => {
        const limit = p.low_stock_threshold ?? threshold;
        return p.quantity <= limit;
      })
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5)
      .map(p => ({
        id: `stock-${p.id}`,
        kind: 'low_stock' as const,
        title: `${p.name} — ${p.quantity} left`,
        detail: 'Low stock',
        detailTone: 'muted' as const,
        productId: p.id,
      }));

    const debts: AttentionItem[] = [];
    for (const d of debtsRes.data ?? []) {
      const rawCustomer = d.customer as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null;
      const customer = Array.isArray(rawCustomer)
        ? rawCustomer[0]
        : rawCustomer;
      const name = customer?.name?.trim() || 'Customer';
      const owed = Math.max(0, Number(d.amount_owed) - Number(d.amount_paid));
      const days = daysSince(d.created_at);
      if (!isDebtOverdue(days, reminderDays) || owed <= 0) continue;
      debts.push({
        id: `debt-${d.id}`,
        kind: 'debt',
        title: `${name} owes ${formatNaira(owed)}`,
        detail: `${days} day${days === 1 ? '' : 's'} overdue`,
        detailTone: 'danger',
        customerId: customer?.id ?? d.customer_id,
      });
    }

    setItems([...debts, ...lowStock].slice(0, 6));
    setLoading(false);
  }, [shopId, threshold, reminderDays]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}
