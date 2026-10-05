import type { CustomProductField } from '../types/domain';

export function normalizeCustomProductFields(
  value: unknown,
): CustomProductField[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is CustomProductField =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as CustomProductField).id === 'string' &&
        typeof (item as CustomProductField).label === 'string',
    )
    .map(item => ({
      id: item.id,
      label: item.label.trim(),
      enabled: item.enabled !== false,
    }))
    .filter(item => item.label.length > 0);
}

export function createCustomProductField(label: string): CustomProductField {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    label: label.trim(),
    enabled: true,
  };
}

export function enabledCustomFields(
  fields: CustomProductField[] | null | undefined,
): CustomProductField[] {
  return (fields ?? []).filter(f => f.enabled);
}
