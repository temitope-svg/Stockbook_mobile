export function isLowStock(
  quantity: number,
  productThreshold: number | null | undefined,
  profileThreshold: number,
): boolean {
  const limit = productThreshold ?? profileThreshold;
  return quantity <= limit;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  uk_used: 'UK Used',
  nigerian_used: 'Nigerian Used',
};

export function conditionLabel(
  condition: string | null | undefined,
): string | null {
  if (!condition) return null;
  return CONDITION_LABELS[condition] ?? condition;
}

export function productSubtitle(product: {
  category: string | null;
  variant: string | null;
  condition: string | null;
}): string {
  const condition = conditionLabel(product.condition);
  const details = [condition, product.variant].filter(Boolean).join(', ');
  if (product.category && details) return `${product.category} · ${details}`;
  if (product.category) return product.category;
  return details || 'Product';
}
