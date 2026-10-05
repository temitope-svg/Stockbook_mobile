import { supabase } from '../lib/supabase';
import type { PaymentStatus } from '../types/domain';

/** Keep sales.payment_status in sync with the linked debt after a payment. */
export async function syncSaleStatusFromDebt(debtId: string): Promise<{
  saleId: string | null;
  paymentStatus: PaymentStatus | null;
}> {
  const { data: debt, error } = await supabase
    .from('debts')
    .select('sale_id, amount_owed, amount_paid, status')
    .eq('id', debtId)
    .maybeSingle();

  if (error || !debt?.sale_id) {
    return { saleId: null, paymentStatus: null };
  }

  const paid = Number(debt.amount_paid);
  const owed = Number(debt.amount_owed);
  const paymentStatus: PaymentStatus =
    debt.status === 'paid' || paid >= owed
      ? 'paid'
      : paid > 0
        ? 'partial'
        : 'credit';

  const { error: saleError } = await supabase
    .from('sales')
    .update({ payment_status: paymentStatus })
    .eq('id', debt.sale_id);

  if (saleError) {
    return { saleId: debt.sale_id, paymentStatus: null };
  }

  return { saleId: debt.sale_id, paymentStatus };
}
