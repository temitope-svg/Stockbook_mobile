export type PaymentStatus = 'paid' | 'credit' | 'partial';

export type PaymentMethod = 'cash' | 'transfer' | 'pos';

export type ProductCondition = 'new' | 'uk_used' | 'nigerian_used';

export type CustomFieldValues = Record<string, string>;

export type Product = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number | null;
  image_url: string | null;
  imei: string | null;
  condition: ProductCondition | null;
  variant: string | null;
  custom_fields: CustomFieldValues | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessType =
  | 'phones_gadgets'
  | 'fashion'
  | 'provisions'
  | 'pharmacy'
  | 'general';

export type ShopRole = 'owner' | 'manager' | 'cashier';

export type NicheFieldOverrides = {
  imei?: boolean;
  condition?: boolean;
  variant?: boolean;
};

export type CustomCategory = {
  id: string;
  label: string;
  enabled: boolean;
};

export type CategorySettings = {
  disabled_base: string[];
  custom: CustomCategory[];
};

export type CustomProductField = {
  id: string;
  label: string;
  enabled: boolean;
};

export type Profile = {
  id: string;
  shop_name: string;
  owner_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  business_type: BusinessType;
  low_stock_threshold: number | null;
  debt_reminder_days: number | null;
  field_overrides: NicheFieldOverrides | null;
  category_settings: CategorySettings | null;
  custom_product_fields: CustomProductField[] | null;
};

export type ShopMembership = {
  id: string;
  shop_id: string;
  user_id: string;
  role: ShopRole;
  status: string;
  display_name: string | null;
};

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone_number: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
};
