import type { BusinessType } from '../types/domain';

export const BUSINESS_TYPE_OPTIONS: {
  value: BusinessType;
  label: string;
  shortLabel: string;
}[] = [
  {
    value: 'phones_gadgets',
    label: 'Phones & gadgets',
    shortLabel: 'Phones & gadgets',
  },
  {
    value: 'fashion',
    label: 'Fashion & clothing',
    shortLabel: 'Fashion',
  },
  {
    value: 'provisions',
    label: 'Provisions & groceries',
    shortLabel: 'Provisions',
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy',
    shortLabel: 'Pharmacy',
  },
  {
    value: 'general',
    label: 'Something else / general shop',
    shortLabel: 'General',
  },
];

export function businessTypeLabel(businessType: BusinessType): string {
  return (
    BUSINESS_TYPE_OPTIONS.find(o => o.value === businessType)?.label.toLowerCase() ??
    'your shop'
  );
}

export function businessTypeShortLabel(businessType: BusinessType): string {
  return (
    BUSINESS_TYPE_OPTIONS.find(o => o.value === businessType)?.shortLabel ??
    'General'
  );
}

export function firstNameFrom(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || 'there';
}
