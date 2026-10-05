import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getCachedProducts } from '../../../offline/localStore';
import { getOutboxItem } from '../../../offline/outbox';
import type { PaymentMethod, PaymentStatus } from '../../../types/domain';

export type SaleDetailItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productName: string;
  category: string | null;
  imageUrl: string | null;
};

export type SaleDetailData = {
  id: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  items: SaleDetailItem[];
  itemCount: number;
  debtRemaining: number | null;
  pending?: boolean;
  pendingFailed?: boolean;
  pendingError?: string;
};

export function useSaleDetail(
  saleId: string | undefined,
  pending = false,
) {
  const { shopId } = useAuth();
  const [data, setData] = useState<SaleDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!saleId || !shopId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let resolvedSaleId = saleId;

    if (pending) {
      const item = await getOutboxItem(shopId, saleId);
      if (item) {
        const products = await getCachedProducts(shopId);
        const byId = new Map(products.map(p => [p.id, p]));
        const items: SaleDetailItem[] = item.payload.items.map((line, index) => {
          const product = byId.get(line.product_id);
          return {
            id: `${item.clientSaleId}-${index}`,
            productId: line.product_id,
            quantity: line.quantity,
            unitPrice: line.unit_price,
            subtotal: line.quantity * line.unit_price,
            productName: product?.name ?? 'Product',
            category: product?.category ?? null,
            imageUrl: product?.image_url ?? null,
          };
        });
        setData({
          id: item.clientSaleId,
          totalAmount: item.payload.totalAmount,
          paymentStatus: item.payload.paymentStatus,
          paymentMethod: item.payload.paymentMethod,
          createdAt: item.createdAt,
          customerId: item.payload.customerId,
          customerName: item.payload.customerName,
          customerPhone: null,
          items,
          itemCount: items.reduce((sum, row) => sum + row.quantity, 0),
          debtRemaining:
            item.payload.paymentStatus === 'paid'
              ? null
              : Math.max(
                  0,
                  item.payload.totalAmount - item.payload.amountPaid,
                ),
          pending: item.status !== 'failed',
          pendingFailed: item.status === 'failed',
          pendingError: item.lastError,
        });
        setLoading(false);
        return;
      }

      // Synced or discarded — try resolving the server row by client_sale_id.
      const { data: synced } = await supabase
        .from('sales')
        .select('id')
        .eq('user_id', shopId)
        .eq('client_sale_id', saleId)
        .maybeSingle();
      if (!synced?.id) {
        setError('This pending sale is no longer on this phone.');
        setData(null);
        setLoading(false);
        return;
      }
      resolvedSaleId = synced.id;
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(
        `
        id,
        total_amount,
        payment_status,
        payment_method,
        created_at,
        customer_id,
        customer:customers(id, name, phone_number),
        sale_items(
          id,
          quantity,
          unit_price,
          subtotal,
          product_id,
          product:products(id, name, category, image_url)
        )
      `,
      )
      .eq('id', resolvedSaleId)
      .eq('user_id', shopId)
      .maybeSingle();

    if (saleError) {
      setError(saleError.message);
      setData(null);
      setLoading(false);
      return;
    }

    if (!sale) {
      setData(null);
      setLoading(false);
      return;
    }

    const customerRaw = sale.customer as unknown as
      | {
          id: string;
          name: string;
          phone_number: string | null;
        }
      | {
          id: string;
          name: string;
          phone_number: string | null;
        }[]
      | null;
    const customer = Array.isArray(customerRaw)
      ? (customerRaw[0] ?? null)
      : customerRaw;

    const rawItems = (sale.sale_items ?? []) as unknown as {
      id: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      product_id: string;
      product:
        | {
            id: string;
            name: string;
            category: string | null;
            image_url: string | null;
          }
        | {
            id: string;
            name: string;
            category: string | null;
            image_url: string | null;
          }[]
        | null;
    }[];

    const items: SaleDetailItem[] = rawItems.map(item => {
      const product = Array.isArray(item.product)
        ? (item.product[0] ?? null)
        : item.product;
      return {
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        subtotal: Number(
          item.subtotal ?? item.quantity * Number(item.unit_price),
        ),
        productName: product?.name ?? 'Product',
        category: product?.category ?? null,
        imageUrl: product?.image_url ?? null,
      };
    });

    let debtRemaining: number | null = null;
    if (sale.payment_status !== 'paid') {
      const { data: debtRow } = await supabase
        .from('debts')
        .select('amount_owed, amount_paid')
        .eq('sale_id', resolvedSaleId)
        .eq('user_id', shopId)
        .maybeSingle();

      if (debtRow) {
        debtRemaining = Math.max(
          0,
          Number(debtRow.amount_owed) - Number(debtRow.amount_paid),
        );
      }
    }

    setData({
      id: sale.id,
      totalAmount: Number(sale.total_amount),
      paymentStatus: sale.payment_status as PaymentStatus,
      paymentMethod: (sale.payment_method as PaymentMethod | null) ?? null,
      createdAt: sale.created_at,
      customerId: sale.customer_id ?? customer?.id ?? null,
      customerName: customer?.name?.trim() || null,
      customerPhone: customer?.phone_number ?? null,
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      debtRemaining,
      pending: false,
      pendingFailed: false,
    });
    setLoading(false);
  }, [saleId, shopId, pending]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
