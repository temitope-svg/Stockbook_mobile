import { formatPhoneDisplay } from '../../../utils/customer';
import { formatNaira } from '../../../utils/money';
import { paymentMethodLabel } from '../../../utils/paymentMethod';
import {
  formatSaleReceiptDate,
  paymentStatusLabel,
  saleShortId,
} from '../../../utils/sales';
import type { SaleDetailData } from '../hooks/useSaleDetail';

export type SaleReceiptLine = {
  key: string;
  name: string;
  quantity: number;
  unitPrice: string;
  amount: string;
};

export type SaleReceiptModel = {
  shopName: string;
  shopPhone: string | null;
  receiptNo: string;
  dateLabel: string;
  customer: string;
  customerPhone: string | null;
  status: string;
  lines: SaleReceiptLine[];
  total: string;
  balanceOwed: string | null;
};

function receiptPhone(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const formatted = formatPhoneDisplay(phone);
  return formatted === 'No phone' ? null : formatted;
}

export function buildSaleReceiptModel(
  sale: SaleDetailData,
  shopName: string,
  shopPhone?: string | null,
): SaleReceiptModel {
  const method = paymentMethodLabel(sale.paymentMethod);
  return {
    shopName: shopName.trim() || 'StockBook',
    shopPhone: receiptPhone(shopPhone),
    receiptNo: `#${saleShortId(sale.id)}`,
    dateLabel: formatSaleReceiptDate(sale.createdAt),
    customer: sale.customerName?.trim() || 'Walk-in',
    customerPhone: receiptPhone(sale.customerPhone),
    status: [paymentStatusLabel(sale.paymentStatus), method]
      .filter(Boolean)
      .join(' · '),
    lines: sale.items.map(item => ({
      key: item.id,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: formatNaira(item.unitPrice),
      amount: formatNaira(item.subtotal),
    })),
    total: formatNaira(sale.totalAmount),
    balanceOwed:
      sale.debtRemaining != null && sale.debtRemaining > 0
        ? formatNaira(sale.debtRemaining)
        : null,
  };
}
