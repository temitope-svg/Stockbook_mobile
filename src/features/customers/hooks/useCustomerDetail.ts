import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { Customer, PaymentStatus } from '../../../types/domain';

type SaleItemJoin = {
  quantity: number;
  product: { name: string } | { name: string }[] | null;
};

export type CustomerSaleRow = {
  id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  summary: string;
};

export type CustomerDebtRow = {
  id: string;
  amount_owed: number;
  amount_paid: number;
  status: string;
  created_at: string;
  sale_id: string | null;
  summary: string;
  when: string;
};

export type CustomerPaymentRow = {
  id: string;
  amount: number;
  note: string | null;
  payment_method: string | null;
  paid_at: string;
  debt_id: string;
};

export type CustomerDetailData = {
  customer: Customer;
  sales: CustomerSaleRow[];
  debts: CustomerDebtRow[];
  payments: CustomerPaymentRow[];
  lifetimeSpend: number;
  visitCount: number;
  lastPurchaseAt: string | null;
  amountOwed: number;
};

function unwrapProduct(
  product: SaleItemJoin['product'],
): { name: string } | null {
  if (!product) return null;
  return Array.isArray(product) ? (product[0] ?? null) : product;
}

function saleSummary(items: SaleItemJoin[]): string {
  if (!items.length) return 'Sale';
  const parts = items.map(item => {
    const name = unwrapProduct(item.product)?.name ?? 'Item';
    return item.quantity > 1 ? `${name} × ${item.quantity}` : name;
  });
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} + ${parts[1]}`;
  return `${parts[0]} + ${parts.length - 1} more`;
}

export function useCustomerDetail(customerId: string | undefined) {
  const { shopId } = useAuth();
  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!customerId || !shopId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [customerRes, salesRes, debtsRes] = await Promise.all([
      supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('user_id', shopId)
        .maybeSingle(),
      supabase
        .from('sales')
        .select(
          `
          id, total_amount, payment_status, created_at,
          sale_items(quantity, product:products(name))
        `,
        )
        .eq('customer_id', customerId)
        .eq('user_id', shopId)
        .order('created_at', { ascending: false }),
      supabase
        .from('debts')
        .select(
          `
          id, amount_owed, amount_paid, status, created_at, sale_id,
          sale:sales(
            id, created_at,
            sale_items(quantity, product:products(name))
          )
        `,
        )
        .eq('customer_id', customerId)
        .eq('user_id', shopId)
        .order('created_at', { ascending: false }),
    ]);

    if (customerRes.error || !customerRes.data) {
      setError(customerRes.error?.message ?? 'Customer not found');
      setData(null);
      setLoading(false);
      return;
    }
    if (salesRes.error || debtsRes.error) {
      setError(salesRes.error?.message || debtsRes.error?.message || 'Error');
      setLoading(false);
      return;
    }

    const sales: CustomerSaleRow[] = (salesRes.data ?? []).map(sale => {
      const items = (sale.sale_items ?? []) as unknown as SaleItemJoin[];
      return {
        id: sale.id,
        total_amount: Number(sale.total_amount),
        payment_status: sale.payment_status as PaymentStatus,
        created_at: sale.created_at,
        summary: saleSummary(items),
      };
    });

    const debtsRaw = (debtsRes.data ?? []) as unknown as {
      id: string;
      amount_owed: number;
      amount_paid: number;
      status: string;
      created_at: string;
      sale_id: string | null;
      sale:
        | {
            id: string;
            created_at: string;
            sale_items: SaleItemJoin[];
          }
        | {
            id: string;
            created_at: string;
            sale_items: SaleItemJoin[];
          }[]
        | null;
    }[];

    const debts: CustomerDebtRow[] = debtsRaw.map(debt => {
      const sale = Array.isArray(debt.sale) ? (debt.sale[0] ?? null) : debt.sale;
      return {
        id: debt.id,
        amount_owed: Number(debt.amount_owed),
        amount_paid: Number(debt.amount_paid),
        status: debt.status,
        created_at: debt.created_at,
        sale_id: debt.sale_id,
        summary: saleSummary(sale?.sale_items ?? []),
        when: sale?.created_at ?? debt.created_at,
      };
    });

    const debtIds = debts.map(d => d.id);
    let payments: CustomerPaymentRow[] = [];
    if (debtIds.length > 0) {
      const paymentsRes = await supabase
        .from('payments')
        .select('id, amount, note, payment_method, paid_at, debt_id')
        .in('debt_id', debtIds)
        .order('paid_at', { ascending: false });
      if (!paymentsRes.error) {
        payments = (paymentsRes.data ?? []).map(p => ({
          id: p.id,
          amount: Number(p.amount),
          note: p.note,
          payment_method: p.payment_method ?? null,
          paid_at: p.paid_at,
          debt_id: p.debt_id,
        }));
      }
    }

    const amountOwed = debts
      .filter(d => d.status === 'open')
      .reduce(
        (sum, d) => sum + Math.max(0, d.amount_owed - d.amount_paid),
        0,
      );

    setData({
      customer: customerRes.data as Customer,
      sales,
      debts,
      payments,
      lifetimeSpend: sales.reduce((sum, s) => sum + s.total_amount, 0),
      visitCount: sales.length,
      lastPurchaseAt: sales[0]?.created_at ?? null,
      amountOwed,
    });
    setLoading(false);
  }, [customerId, shopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
