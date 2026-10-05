import type { BusinessType, CategorySettings } from '../../../types/domain';
import {
  resolveNicheFields,
  type NicheFieldOverrides,
} from '../../../utils/businessTypeFields';
import {
  mergeCategoryLists,
  normalizeCategorySettings,
  resolveCategories,
} from '../../../utils/productCategories';

export type NicheFields = {
  imei: boolean;
  condition: boolean;
  variant: boolean;
  title: string | null;
  variantLabel: string;
};

const TITLES: Record<BusinessType, string | null> = {
  phones_gadgets: 'Phone & gadget details',
  fashion: 'Fashion details',
  provisions: null,
  pharmacy: null,
  general: null,
};

const VARIANT_LABELS: Record<BusinessType, string> = {
  phones_gadgets: 'Storage / variant',
  fashion: 'Size / colour',
  provisions: 'Variant',
  pharmacy: 'Variant',
  general: 'Variant',
};

export function nicheFieldsFor(
  businessType: BusinessType,
  overrides?: NicheFieldOverrides | null,
): NicheFields {
  const visibility = resolveNicheFields(businessType, overrides);
  const showAny =
    visibility.imei || visibility.condition || visibility.variant;
  return {
    ...visibility,
    title: showAny
      ? TITLES[businessType] ?? 'Product details'
      : null,
    variantLabel: VARIANT_LABELS[businessType] ?? 'Variant',
  };
}

export function categoriesForProductForm(
  businessType: BusinessType,
  current?: string | null,
  categorySettings?: CategorySettings | null,
): string[] {
  const enabled = resolveCategories(
    businessType,
    normalizeCategorySettings(categorySettings),
  );
  const trimmed = current?.trim();
  return mergeCategoryLists(enabled, trimmed ? [trimmed] : []);
}

export function estimatedProfit(cost: number, selling: number) {
  const profit = selling - cost;
  const margin = selling > 0 ? Math.round((profit / selling) * 100) : 0;
  return { profit, margin };
}
