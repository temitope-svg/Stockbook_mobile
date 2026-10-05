import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  getCachedCustomers,
  setCachedCustomers,
  setLastSyncAt,
} from '../../../offline/localStore';
import { fetchIsOnline } from '../../../offline/network';
import type { Customer } from '../../../types/domain';
import {
  DEFAULT_DEBT_REMINDER_DAYS,
  daysSince,
  isDebtOverdue,
} from '../../../utils/customer';

export type CustomerFilter = 'all' | 'owes' | 'overdue' | 'paid';

export type CustomerLedgerRow = Customer & {
  amountOwed: number;
  debtDays: number | null;
  partiallyPaid: boolean;
  hasDebt: boolean;
  isOverdue: boolean;
  lastPurchaseAt: string | null;
};

type DebtRow = {
  customer_id: string;
  amount_owed: number;
  amount_paid: number;
  status: string;
  created_at: string;
};

function buildLedgerRows(
  customers: Customer[],
  debts: DebtRow[],
  lastPurchase: Map<string, string>,
  reminderDays: number,
): CustomerLedgerRow[] {
  return customers.map(customer => {
    const open = debts.filter(d => d.customer_id === customer.id);
    const amountOwed = open.reduce(
      (sum, d) =>
        sum + Math.max(0, Number(d.amount_owed) - Number(d.amount_paid)),
      0,
    );
    const partiallyPaid = open.some(
      d =>
        Number(d.amount_paid) > 0 &&
        Number(d.amount_paid) < Number(d.amount_owed),
    );
    const oldest = open
      .map(d => d.created_at)
      .sort()
      .at(0);
    const debtDays = oldest ? daysSince(oldest) : null;
    const isOverdue =
      debtDays !== null &&
      isDebtOverdue(debtDays, reminderDays) &&
      amountOwed > 0;

    return {
      ...customer,
      amountOwed,
      debtDays,
      partiallyPaid,
      hasDebt: amountOwed > 0,
      isOverdue,
      lastPurchaseAt: lastPurchase.get(customer.id) ?? null,
    };
  });
}

export function useCustomerLedger() {
  const { profile, shopId } = useAuth();
  const reminderDays = profile?.debt_reminder_days ?? DEFAULT_DEBT_REMINDER_DAYS;

  const [rows, setRows] = useState<CustomerLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setRows([]);
      setLoading(false);
      setFromCache(false);
      return;
    }

    setLoading(true);
    setError(null);

    const cached = await getCachedCustomers(shopId);
    if (cached.length > 0) {
      setRows(cached);
      setFromCache(true);
      setLoading(false);
    }

    const online = await fetchIsOnline();
    if (!online) {
      if (cached.length === 0) {
        setRows([]);
        setFromCache(true);
        setError('Connect once to download your customers.');
        setLoading(false);
      }
      return;
    }

    try {
      const [customersRes, debtsRes, salesRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('user_id', shopId)
          .order('name', { ascending: true }),
        supabase
          .from('debts')
          .select('customer_id, amount_owed, amount_paid, status, created_at')
          .eq('user_id', shopId)
          .eq('status', 'open'),
        supabase
          .from('sales')
          .select('customer_id, created_at')
          .eq('user_id', shopId)
          .not('customer_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(800),
      ]);

      if (customersRes.error || debtsRes.error || salesRes.error) {
        if (cached.length === 0) {
          setError(
            customersRes.error?.message ||
              debtsRes.error?.message ||
              salesRes.error?.message ||
              'Failed to load customers',
          );
          setFromCache(false);
          setLoading(false);
        }
        return;
      }

      const customers = (customersRes.data ?? []) as Customer[];
      const debts = (debtsRes.data ?? []) as DebtRow[];
      const lastPurchase = new Map<string, string>();
      for (const sale of salesRes.data ?? []) {
        if (!sale.customer_id || lastPurchase.has(sale.customer_id)) continue;
        lastPurchase.set(sale.customer_id, sale.created_at);
      }

      const next = buildLedgerRows(customers, debts, lastPurchase, reminderDays);
      setRows(next);
      setFromCache(false);
      setError(null);
      await setCachedCustomers(shopId, next);
      await setLastSyncAt(shopId, new Date().toISOString());
      setLoading(false);
    } catch {
      if (cached.length === 0) {
        setError('Connect once to download your customers.');
        setRows([]);
        setFromCache(true);
        setLoading(false);
      }
    }
  }, [shopId, reminderDays]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const withDebt = rows.filter(r => r.hasDebt);
    return {
      totalOwed: withDebt.reduce((sum, r) => sum + r.amountOwed, 0),
      customersWithDebt: withDebt.length,
      overdueCount: rows.filter(r => r.isOverdue).length,
      paidUpCount: rows.filter(r => !r.hasDebt).length,
      totalCustomers: rows.length,
      reminderDays,
    };
  }, [rows, reminderDays]);

  return { rows, stats, reminderDays, loading, error, refresh, fromCache };
}

export function filterCustomers(
  rows: CustomerLedgerRow[],
  search: string,
  filter: CustomerFilter,
): CustomerLedgerRow[] {
  const q = search.trim().toLowerCase();
  let list = rows.filter(r => {
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.phone_number ?? '').toLowerCase().includes(q)
    );
  });

  if (filter === 'owes') list = list.filter(r => r.hasDebt);
  else if (filter === 'overdue') list = list.filter(r => r.isOverdue);
  else if (filter === 'paid') list = list.filter(r => !r.hasDebt);

  return [...list].sort((a, b) => {
    if (b.amountOwed !== a.amountOwed) return b.amountOwed - a.amountOwed;
    return a.name.localeCompare(b.name);
  });
}
