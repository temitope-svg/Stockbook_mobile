import type { PaymentMethod } from '../types/domain';

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] =
  [
    { value: 'cash', label: 'Cash' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'pos', label: 'POS' },
  ];

export function paymentMethodLabel(
  method: PaymentMethod | string | null | undefined,
): string | null {
  if (!method) return null;
  return (
    PAYMENT_METHOD_OPTIONS.find(option => option.value === method)?.label ??
    method
  );
}
