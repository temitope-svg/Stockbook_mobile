import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { permissionsFor } from '../../../auth/permissions';
import { supabase } from '../../../lib/supabase';
import type {
  Supplier,
  SupplierListRow,
  SupplierSpendStats,
} from '../types';

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function useSupplierList() {
  const { shopId, role } = useAuth();
  const canView = permissionsFor(role).canEditProducts;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [spendMap, setSpendMap] = useState<Map<string, SupplierSpendStats>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!shopId || !canView) {
        setSuppliers([]);
        setSpendMap(new Map());
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [suppliersRes, movementsRes] = await Promise.all([
          supabase
            .from('suppliers')
            .select('*')
            .eq('user_id', shopId)
            .order('name', { ascending: true }),
          supabase
            .from('stock_movements')
            .select('supplier_id, quantity, unit_cost, created_at')
            .eq('user_id', shopId)
            .eq('reason', 'restock')
            .not('supplier_id', 'is', null),
        ]);

        if (suppliersRes.error) throw suppliersRes.error;
        if (movementsRes.error) throw movementsRes.error;

        const monthStart = startOfMonth().getTime();
        const map = new Map<string, SupplierSpendStats>();

        for (const row of movementsRes.data ?? []) {
          if (!row.supplier_id) continue;
          const prev = map.get(row.supplier_id) ?? {
            spend: 0,
            count: 0,
            lastRestockAt: null,
            monthSpend: 0,
          };
          const unit = row.unit_cost != null ? Number(row.unit_cost) : 0;
          const qty = Number(row.quantity) || 0;
          const line = qty * unit;
          const createdAt = row.created_at as string;
          const inMonth = new Date(createdAt).getTime() >= monthStart;

          map.set(row.supplier_id, {
            spend: prev.spend + line,
            count: prev.count + 1,
            lastRestockAt:
              !prev.lastRestockAt || createdAt > prev.lastRestockAt
                ? createdAt
                : prev.lastRestockAt,
            monthSpend: prev.monthSpend + (inMonth ? line : 0),
          });
        }

        setSuppliers((suppliersRes.data as Supplier[]) ?? []);
        setSpendMap(map);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Couldn’t load suppliers';
        setError(
          msg.includes('suppliers') || msg.includes('schema cache')
            ? 'Run stockbook-suppliers-migration.sql in Supabase, then try again.'
            : msg,
        );
        setSuppliers([]);
        setSpendMap(new Map());
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [shopId, canView],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const rows: SupplierListRow[] = useMemo(
    () =>
      suppliers.map(s => {
        const stats = spendMap.get(s.id);
        return {
          ...s,
          spend: stats?.spend ?? 0,
          restockCount: stats?.count ?? 0,
          lastRestockAt: stats?.lastRestockAt ?? null,
        };
      }),
    [suppliers, spendMap],
  );

  const monthSpend = useMemo(() => {
    let sum = 0;
    for (const v of spendMap.values()) sum += v.monthSpend;
    return sum;
  }, [spendMap]);

  const totalSpend = useMemo(() => {
    let sum = 0;
    for (const v of spendMap.values()) sum += v.spend;
    return sum;
  }, [spendMap]);

  return {
    rows,
    suppliers,
    spendMap,
    monthSpend,
    totalSpend,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
}

export function filterSuppliers(rows: SupplierListRow[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    s =>
      s.name.toLowerCase().includes(q) ||
      (s.phone_number ?? '').includes(q) ||
      (s.notes ?? '').toLowerCase().includes(q),
  );
}
