import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { Product } from '../../../types/domain';

export type StockMovementKind = 'in' | 'out';
export type StockMovementReason = 'opening' | 'restock' | 'sale' | 'adjustment';

export type StockMovementView = {
  id: string;
  kind: StockMovementKind;
  quantity: number;
  reason: StockMovementReason;
  note: string | null;
  created_at: string;
  balance: number;
  customerName: string | null;
  supplierName?: string | null;
};

export type ProductSaleRow = {
  saleId: string;
  quantity: number;
  unitPrice: number;
  created_at: string;
  customerName: string | null;
};

export type ProductDetailData = {
  product: Product;
  sales: ProductSaleRow[];
  movements: StockMovementView[];
  sparkline: number[];
  soldQty: number;
  revenue: number;
};

export function useProductDetail(productId: string | undefined) {
  const { shopId } = useAuth();
  const [data, setData] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!productId || !shopId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const productRes = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', shopId)
      .maybeSingle();

    if (productRes.error || !productRes.data) {
      setError(productRes.error?.message ?? 'Product not found');
      setData(null);
      setLoading(false);
      return;
    }

    const product = productRes.data as Product;

    const salesRes = await supabase
      .from('sale_items')
      .select(
        'quantity, unit_price, sale:sales(id, created_at, customer:customers(name))',
      )
      .eq('product_id', productId)
      .order('id', { ascending: false });

    if (salesRes.error) {
      setError(salesRes.error.message);
      setLoading(false);
      return;
    }

    const sales: ProductSaleRow[] = (salesRes.data ?? []).map(row => {
      const saleRaw = row.sale as unknown as
        | {
            id: string;
            created_at: string;
            customer: { name: string } | { name: string }[] | null;
          }
        | {
            id: string;
            created_at: string;
            customer: { name: string } | { name: string }[] | null;
          }[]
        | null;
      const sale = Array.isArray(saleRaw) ? (saleRaw[0] ?? null) : saleRaw;
      const customerRaw = sale?.customer ?? null;
      const customer = Array.isArray(customerRaw)
        ? (customerRaw[0] ?? null)
        : customerRaw;
      return {
        saleId: sale?.id ?? '',
        quantity: row.quantity,
        unitPrice: Number(row.unit_price),
        created_at: sale?.created_at ?? product.created_at,
        customerName: customer?.name ?? null,
      };
    });

    const soldQty = sales.reduce((sum, s) => sum + s.quantity, 0);
    const revenue = sales.reduce(
      (sum, s) => sum + s.quantity * s.unitPrice,
      0,
    );

    const movRes = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', shopId)
      .order('created_at', { ascending: true });

    let raw = movRes.data ?? [];
    if (movRes.error || raw.length === 0) {
      raw = [];
      const opening = product.quantity + soldQty;
      if (opening > 0) {
        raw.push({
          id: `opening-${product.id}`,
          user_id: product.user_id,
          product_id: product.id,
          kind: 'in',
          quantity: opening,
          reason: 'opening',
          sale_id: null,
          note: null,
          unit_cost: null,
          supplier_id: null,
          created_at: product.created_at,
        });
      }
      for (const sale of [...sales].reverse()) {
        raw.push({
          id: `sale-${sale.saleId}-${sale.created_at}`,
          user_id: product.user_id,
          product_id: product.id,
          kind: 'out',
          quantity: sale.quantity,
          reason: 'sale',
          sale_id: sale.saleId,
          note: sale.customerName,
          unit_cost: null,
          supplier_id: null,
          created_at: sale.created_at,
        });
      }
    }

    let balance = 0;
    const withBalance: StockMovementView[] = raw.map(m => {
      balance += m.kind === 'in' ? m.quantity : -m.quantity;
      const sale = sales.find(s => s.saleId && s.saleId === m.sale_id);
      return {
        id: m.id,
        kind: m.kind as StockMovementKind,
        quantity: m.quantity,
        reason: m.reason as StockMovementReason,
        note: m.note,
        created_at: m.created_at,
        balance: Math.max(0, balance),
        customerName: sale?.customerName ?? null,
      };
    });

    setData({
      product,
      sales,
      movements: [...withBalance].reverse(),
      sparkline: withBalance.map(m => m.balance),
      soldQty,
      revenue,
    });
    setLoading(false);
  }, [productId, shopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
