import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { permissionsFor } from '../../../auth/permissions';
import { supabase } from '../../../lib/supabase';
import type {
  Supplier,
  SupplierDetailData,
  SupplierRestockRow,
} from '../types';

export function useSupplierDetail(id: string | undefined) {
  const { shopId, role } = useAuth();
  const canView = permissionsFor(role).canEditProducts;

  const [data, setData] = useState<SupplierDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!shopId || !canView || !id) {
        setData(null);
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .eq('user_id', shopId)
          .single();

        if (supplierError) throw supplierError;

        const { data: movements, error: moveError } = await supabase
          .from('stock_movements')
          .select('id, product_id, quantity, unit_cost, note, created_at')
          .eq('user_id', shopId)
          .eq('supplier_id', id)
          .eq('reason', 'restock')
          .order('created_at', { ascending: false })
          .limit(50);

        if (moveError) throw moveError;

        const productIds = [
          ...new Set((movements ?? []).map(m => m.product_id as string)),
        ];
        const nameById = new Map<string, string>();
        if (productIds.length > 0) {
          const { data: products, error: productError } = await supabase
            .from('products')
            .select('id, name')
            .eq('user_id', shopId)
            .in('id', productIds);
          if (productError) throw productError;
          for (const p of products ?? []) {
            nameById.set(p.id as string, p.name as string);
          }
        }

        const restocks: SupplierRestockRow[] = (movements ?? []).map(m => {
          const unitCost = m.unit_cost != null ? Number(m.unit_cost) : null;
          const qty = Number(m.quantity) || 0;
          return {
            id: m.id as string,
            productId: m.product_id as string,
            productName: nameById.get(m.product_id as string) ?? 'Product',
            quantity: qty,
            unitCost,
            spend: unitCost != null ? qty * unitCost : 0,
            note: (m.note as string | null) ?? null,
            createdAt: m.created_at as string,
          };
        });

        const totalSpend = restocks.reduce((sum, r) => sum + r.spend, 0);

        setData({
          supplier: supplier as Supplier,
          restocks,
          totalSpend,
          restockCount: restocks.length,
          lastRestockAt: restocks[0]?.createdAt ?? null,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Couldn’t load supplier';
        setError(msg);
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [shopId, canView, id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
}
