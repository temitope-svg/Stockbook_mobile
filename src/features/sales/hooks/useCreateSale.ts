import { supabase } from '../../../lib/supabase';
import type { PaymentMethod, PaymentStatus } from '../../../types/domain';

export type CreateSaleItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type CreateSaleInput = {
  customerId: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amountPaid: number;
  items: CreateSaleItem[];
};

export async function createSale(
  input: CreateSaleInput,
  clientSaleId?: string | null,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_sale', {
    p_customer_id: input.customerId,
    p_payment_status: input.paymentStatus,
    p_payment_method: input.paymentMethod,
    p_amount_paid: input.amountPaid,
    p_items: input.items,
    ...(clientSaleId ? { p_client_sale_id: clientSaleId } : {}),
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Could not create sale');
  }

  return data as string;
}
