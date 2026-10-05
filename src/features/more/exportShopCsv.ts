import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import type { BusinessType, NicheFieldOverrides } from '../../types/domain';
import {
  csvDateStamp,
  formatCsvDateTime,
  rowsToCsv,
  shareCsv,
} from '../../utils/csv';
import { resolveNicheFields } from '../../utils/businessTypeFields';
import { conditionLabel } from '../../utils/product';
import { paymentMethodLabel } from '../../utils/paymentMethod';
import { paymentStatusLabel } from '../../utils/sales';

export type ShopCsvKind = 'products' | 'sales' | 'customers' | 'suppliers';

export async function exportShopCsv(
  kind: ShopCsvKind,
  shopId: string,
  options?: {
    businessType?: BusinessType;
    fieldOverrides?: NicheFieldOverrides | null;
    lowStockFallback?: number;
  },
) {
  const stamp = csvDateStamp();

  if (kind === 'products') {
    const { data, error } = await supabase
      .from('products')
      .select(
        'name, category, cost_price, selling_price, quantity, low_stock_threshold, variant, condition, imei, is_active',
      )
      .eq('user_id', shopId)
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    const products = data ?? [];
    const niche = resolveNicheFields(
      options?.businessType ?? 'general',
      options?.fieldOverrides,
    );
    const includeVariant =
      niche.variant && products.some(p => Boolean(p.variant?.trim()));
    const includeCondition =
      niche.condition && products.some(p => p.condition != null);
    const includeImei = niche.imei && products.some(p => Boolean(p.imei?.trim()));
    const headers = [
      'Name',
      'Category',
      ...(includeVariant ? ['Variant'] : []),
      ...(includeCondition ? ['Condition'] : []),
      ...(includeImei ? ['IMEI'] : []),
      'Cost price (NGN)',
      'Selling price (NGN)',
      'Quantity',
      'Low stock at',
      'Status',
    ];
    const rows = products.map(p => {
      const row: (string | number)[] = [p.name, p.category ?? ''];
      if (includeVariant) row.push(p.variant ?? '');
      if (includeCondition) row.push(conditionLabel(p.condition) ?? '');
      if (includeImei) row.push(p.imei ?? '');
      row.push(
        Math.round(Number(p.cost_price)),
        Math.round(Number(p.selling_price)),
        p.quantity,
        p.low_stock_threshold ?? options?.lowStockFallback ?? 5,
        p.is_active ? 'active' : 'archived',
      );
      return row;
    });
    await shareCsv(`stockbook-products-${stamp}.csv`, rowsToCsv(headers, rows));
    return;
  }

  if (kind === 'sales') {
    const { data, error } = await supabase
      .from('sales')
      .select(
        `
        created_at, total_amount, payment_status, payment_method,
        customer:customers(name),
        sale_items(quantity, product:products(name))
      `,
      )
      .eq('user_id', shopId)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const headers = [
      'Date',
      'Customer',
      'Items',
      'Status',
      'Payment method',
      'Total (NGN)',
    ];
    const rows = (data ?? []).map(sale => {
      const customerRaw = sale.customer as
        | { name: string }
        | { name: string }[]
        | null;
      const customer = Array.isArray(customerRaw)
        ? customerRaw[0]
        : customerRaw;
      const items = (sale.sale_items as
        | { quantity: number; product: { name: string } | { name: string }[] | null }[]
        | null) ?? [];
      const summary = items
        .map(item => {
          const product = Array.isArray(item.product)
            ? item.product[0]
            : item.product;
          return `${product?.name ?? 'Item'} × ${item.quantity}`;
        })
        .join('; ');
      return [
        formatCsvDateTime(sale.created_at),
        customer?.name?.trim() || 'Walk-in',
        summary,
        paymentStatusLabel(sale.payment_status),
        paymentMethodLabel(sale.payment_method) ?? '',
        Math.round(Number(sale.total_amount)),
      ];
    });
    await shareCsv(`stockbook-sales-${stamp}.csv`, rowsToCsv(headers, rows));
    return;
  }

  if (kind === 'customers') {
    const [customersRes, debtsRes] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name, phone_number, notes, created_at')
        .eq('user_id', shopId)
        .order('name', { ascending: true }),
      supabase
        .from('debts')
        .select('customer_id, amount_owed, amount_paid, status, created_at')
        .eq('user_id', shopId)
        .eq('status', 'open'),
    ]);
    if (customersRes.error) throw new Error(customersRes.error.message);
    if (debtsRes.error) throw new Error(debtsRes.error.message);

    const owedByCustomer = new Map<
      string,
      { owed: number; days: number | null; partial: boolean }
    >();
    for (const debt of debtsRes.data ?? []) {
      const remaining = Math.max(
        0,
        Number(debt.amount_owed) - Number(debt.amount_paid),
      );
      if (remaining <= 0) continue;
      const prev = owedByCustomer.get(debt.customer_id) ?? {
        owed: 0,
        days: null,
        partial: false,
      };
      const days = Math.floor(
        (Date.now() - new Date(debt.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      owedByCustomer.set(debt.customer_id, {
        owed: prev.owed + remaining,
        days: prev.days === null ? days : Math.max(prev.days, days),
        partial: prev.partial || Number(debt.amount_paid) > 0,
      });
    }

    const headers = [
      'Name',
      'Phone',
      'Amount owed (NGN)',
      'Debt days',
      'Overdue',
      'Partially paid',
      'Notes',
      'Added on',
    ];
    const reminderDays = 7;
    const rows = (customersRes.data ?? []).map(c => {
      const debt = owedByCustomer.get(c.id);
      const days = debt?.days ?? '';
      const overdue =
        debt != null && debt.days != null && debt.days >= reminderDays;
      return [
        c.name,
        c.phone_number ?? '',
        Math.round(debt?.owed ?? 0),
        days,
        overdue ? 'yes' : 'no',
        debt?.partial ? 'yes' : 'no',
        c.notes ?? '',
        c.created_at.slice(0, 10),
      ];
    });
    await shareCsv(
      `stockbook-customers-${stamp}.csv`,
      rowsToCsv(headers, rows),
    );
    return;
  }

  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, phone_number, notes, created_at')
    .eq('user_id', shopId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);

  const { data: restocks } = await supabase
    .from('stock_movements')
    .select('supplier_id, quantity, unit_cost')
    .eq('user_id', shopId)
    .eq('reason', 'restock')
    .not('supplier_id', 'is', null);

  const spendBySupplier = new Map<string, { count: number; spend: number }>();
  for (const row of restocks ?? []) {
    if (!row.supplier_id) continue;
    const prev = spendBySupplier.get(row.supplier_id) ?? {
      count: 0,
      spend: 0,
    };
    spendBySupplier.set(row.supplier_id, {
      count: prev.count + 1,
      spend: prev.spend + Number(row.quantity) * Number(row.unit_cost ?? 0),
    });
  }

  const headers = [
    'Name',
    'Phone',
    'Notes',
    'Restocks',
    'Spend (NGN)',
    'Added on',
  ];
  const rows = (data ?? []).map(s => {
    const stats = spendBySupplier.get(s.id);
    return [
      s.name,
      s.phone_number ?? '',
      s.notes ?? '',
      stats?.count ?? 0,
      Math.round(stats?.spend ?? 0),
      s.created_at.slice(0, 10),
    ];
  });
  await shareCsv(`stockbook-suppliers-${stamp}.csv`, rowsToCsv(headers, rows));
}

export function promptShopCsvExport(
  shopId: string | null | undefined,
  canExport: boolean,
  options?: {
    businessType?: BusinessType;
    fieldOverrides?: NicheFieldOverrides | null;
    lowStockFallback?: number;
  },
) {
  if (!canExport) {
    Alert.alert('Export unavailable', 'Only owners and managers can export.');
    return;
  }
  if (!shopId) return;

  Alert.alert('Export as CSV', 'Choose what to export', [
    {
      text: 'Products',
      onPress: () => {
        void exportShopCsv('products', shopId, options).catch(e =>
          Alert.alert("Couldn't export", e instanceof Error ? e.message : 'Try again.'),
        );
      },
    },
    {
      text: 'Sales',
      onPress: () => {
        void exportShopCsv('sales', shopId, options).catch(e =>
          Alert.alert("Couldn't export", e instanceof Error ? e.message : 'Try again.'),
        );
      },
    },
    {
      text: 'Customers',
      onPress: () => {
        void exportShopCsv('customers', shopId, options).catch(e =>
          Alert.alert("Couldn't export", e instanceof Error ? e.message : 'Try again.'),
        );
      },
    },
    {
      text: 'Suppliers',
      onPress: () => {
        void exportShopCsv('suppliers', shopId, options).catch(e =>
          Alert.alert("Couldn't export", e instanceof Error ? e.message : 'Try again.'),
        );
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
