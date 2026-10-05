import { supabase } from '../lib/supabase';
import type { Customer, Product } from '../types/domain';
import {
  DEFAULT_DEBT_REMINDER_DAYS,
  daysSince,
  isDebtOverdue,
} from '../utils/customer';
import type { CustomerLedgerRow } from '../features/customers/hooks/useCustomerLedger';
import {
  setCachedCustomers,
  setCachedProducts,
  setLastSyncAt,
} from './localStore';

const PRODUCT_COLUMNS =
  'id, user_id, name, category, cost_price, selling_price, quantity, low_stock_threshold, image_url, imei, condition, variant, custom_fields, is_active, created_at, updated_at';

type DebtRow = {
  customer_id: string;
  amount_owed: number;
  amount_paid: number;
  status: string;
  created_at: string;
};

/** Download products + customers into AsyncStorage for offline use. */
export async function warmShopCache(
  shopId: string,
  reminderDays = DEFAULT_DEBT_REMINDER_DAYS,
): Promise<boolean> {
  try {
    const [productsRes, customersRes, debtsRes, salesRes] = await Promise.all([
      supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('user_id', shopId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
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

    if (productsRes.error || !productsRes.data) return false;

    await setCachedProducts(shopId, productsRes.data as Product[]);

    if (!customersRes.error && customersRes.data) {
      const customers = customersRes.data as Customer[];
      const debts = (debtsRes.data ?? []) as DebtRow[];
      const lastPurchase = new Map<string, string>();
      for (const sale of salesRes.data ?? []) {
        if (!sale.customer_id || lastPurchase.has(sale.customer_id)) continue;
        lastPurchase.set(sale.customer_id, sale.created_at);
      }

      const rows: CustomerLedgerRow[] = customers.map(customer => {
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
        const oldest = open.map(d => d.created_at).sort().at(0);
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

      await setCachedCustomers(shopId, rows);
    }

    await setLastSyncAt(shopId, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
