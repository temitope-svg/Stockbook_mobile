import type {
  PaymentMethod,
  PaymentStatus,
  Product,
} from '../types/domain';
import type { CreateSaleItem } from '../features/sales/hooks/useCreateSale';
import type { CustomerLedgerRow } from '../features/customers/hooks/useCustomerLedger';

export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export type PendingSalePayload = {
  customerId: string | null;
  customerName: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  amountPaid: number;
  items: CreateSaleItem[];
  /** Line labels for sales list / receipt before server sync */
  itemSummary: string;
  totalAmount: number;
};

export type OutboxSaleItem = {
  clientSaleId: string;
  shopId: string;
  createdAt: string;
  status: OutboxStatus;
  payload: PendingSalePayload;
  lastError?: string;
  serverSaleId?: string;
  retries: number;
  /** Local product qty still reduced for this sale. False after stock was put back. */
  stockHeld?: boolean;
};

export type ShopCacheSnapshot = {
  products: Product[];
  customers: CustomerLedgerRow[];
  cachedAt: string | null;
};
