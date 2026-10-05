import type { BusinessType } from '../types/domain';

export type NicheFieldOverrides = {
  imei?: boolean;
  condition?: boolean;
  variant?: boolean;
};

export type NicheFieldVisibility = {
  imei: boolean;
  condition: boolean;
  variant: boolean;
};

export const NICHE_FIELD_KEYS = ['variant', 'condition', 'imei'] as const;

export const NICHE_FIELD_META: Record<
  keyof NicheFieldVisibility,
  { title: string; description?: string }
> = {
  variant: {
    title: 'Size / colour',
  },
  condition: {
    title: 'Condition',
    description: 'New / UK used / Nigerian used',
  },
  imei: {
    title: 'IMEI / serial number',
  },
};

const DEFAULTS_BY_BUSINESS_TYPE: Record<BusinessType, NicheFieldVisibility> = {
  phones_gadgets: { imei: true, condition: true, variant: true },
  fashion: { imei: false, condition: false, variant: true },
  provisions: { imei: false, condition: false, variant: false },
  pharmacy: { imei: false, condition: false, variant: false },
  general: { imei: false, condition: false, variant: false },
};

export function defaultNicheFieldsFor(
  businessType: BusinessType,
): NicheFieldVisibility {
  return { ...DEFAULTS_BY_BUSINESS_TYPE[businessType] };
}

export function resolveNicheFields(
  businessType: BusinessType,
  overrides?: NicheFieldOverrides | null,
): NicheFieldVisibility {
  const base = defaultNicheFieldsFor(businessType);
  if (!overrides) return base;
  return {
    imei: overrides.imei ?? base.imei,
    condition: overrides.condition ?? base.condition,
    variant: overrides.variant ?? base.variant,
  };
}

export function nicheFieldsToOverrides(
  fields: NicheFieldVisibility,
): NicheFieldOverrides {
  return {
    imei: fields.imei,
    condition: fields.condition,
    variant: fields.variant,
  };
}

export function nicheFieldsMatchDefaults(
  businessType: BusinessType,
  fields: NicheFieldVisibility,
): boolean {
  const defaults = defaultNicheFieldsFor(businessType);
  return (
    fields.imei === defaults.imei &&
    fields.condition === defaults.condition &&
    fields.variant === defaults.variant
  );
}
