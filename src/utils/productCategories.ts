import type {
  BusinessType,
  CategorySettings,
  CustomCategory,
} from '../types/domain';

export const BASE_CATEGORIES: Record<BusinessType, string[]> = {
  phones_gadgets: ['Phones', 'Accessories', 'Tablets', 'Laptops'],
  fashion: ['Clothing', 'Shoes', 'Bags', 'Accessories'],
  provisions: ['Food', 'Drinks', 'Household', 'Toiletries'],
  pharmacy: ['Medicines', 'Supplements', 'Personal care'],
  general: ['General', 'Electronics', 'Household', 'Other'],
};

export function baseCategoriesFor(businessType: BusinessType): string[] {
  return [...(BASE_CATEGORIES[businessType] ?? BASE_CATEGORIES.general)];
}

export function emptyCategorySettings(): CategorySettings {
  return { disabled_base: [], custom: [] };
}

export function normalizeCategorySettings(value: unknown): CategorySettings {
  if (!value || typeof value !== 'object') return emptyCategorySettings();
  const raw = value as Partial<CategorySettings>;
  const disabled_base = Array.isArray(raw.disabled_base)
    ? raw.disabled_base.filter((item): item is string => typeof item === 'string')
    : [];
  const custom = Array.isArray(raw.custom)
    ? raw.custom
        .filter(
          (item): item is CustomCategory =>
            !!item &&
            typeof item === 'object' &&
            typeof (item as CustomCategory).id === 'string' &&
            typeof (item as CustomCategory).label === 'string',
        )
        .map(item => ({
          id: item.id,
          label: item.label.trim(),
          enabled: item.enabled !== false,
        }))
        .filter(item => item.label.length > 0)
    : [];
  return { disabled_base, custom };
}

export function createCustomCategory(label: string): CustomCategory {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    label: label.trim(),
    enabled: true,
  };
}

/** Enabled categories for filters / product form (respects settings). */
export function resolveCategories(
  businessType: BusinessType,
  settings?: CategorySettings | null,
): string[] {
  const config = settings ?? emptyCategorySettings();
  const disabled = new Set(config.disabled_base.map(n => n.toLowerCase()));
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const name of baseCategoriesFor(businessType)) {
    const key = name.toLowerCase();
    if (disabled.has(key) || seen.has(key)) continue;
    seen.add(key);
    labels.push(name);
  }

  for (const item of config.custom) {
    if (!item.enabled) continue;
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(item.label);
  }

  return labels;
}

export function isBaseCategoryEnabled(
  name: string,
  settings: CategorySettings,
): boolean {
  return !settings.disabled_base.some(
    n => n.toLowerCase() === name.toLowerCase(),
  );
}

export function toggleBaseCategory(
  name: string,
  enabled: boolean,
  settings: CategorySettings,
): CategorySettings {
  const key = name.toLowerCase();
  const disabled_base = settings.disabled_base.filter(
    n => n.toLowerCase() !== key,
  );
  if (!enabled) disabled_base.push(name);
  return { ...settings, disabled_base };
}

/** Deduped list preserving first-seen order. */
export function mergeCategoryLists(...lists: (string | null | undefined)[][]) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const list of lists) {
    for (const name of list) {
      const trimmed = name?.trim() ?? '';
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      labels.push(trimmed);
    }
  }
  return labels;
}

/** @deprecated Prefer resolveCategories + mergeCategoryLists */
export function mergeCategories(
  businessType: BusinessType | null | undefined,
  extras: string[],
): string[] {
  return mergeCategoryLists(
    businessType ? baseCategoriesFor(businessType) : [],
    extras,
  );
}
