export type Supplier = {
  id: string;
  user_id: string;
  name: string;
  phone_number: string | null;
  notes: string | null;
  created_at: string;
};

export type SupplierSpendStats = {
  spend: number;
  count: number;
  lastRestockAt: string | null;
  monthSpend: number;
};

export type SupplierListRow = Supplier & {
  spend: number;
  restockCount: number;
  lastRestockAt: string | null;
};

export type SupplierRestockRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number | null;
  spend: number;
  note: string | null;
  createdAt: string;
};

export type SupplierDetailData = {
  supplier: Supplier;
  restocks: SupplierRestockRow[];
  totalSpend: number;
  restockCount: number;
  lastRestockAt: string | null;
};
