export function paginationRange(
  current: number,
  total: number,
): Array<number | 'ellipsis'> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (current >= total - 2) {
    pages.add(total - 2);
    pages.add(total - 1);
  }

  const sorted = [...pages]
    .filter(p => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const range: Array<number | 'ellipsis'> = [];

  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) range.push('ellipsis');
    range.push(sorted[i]!);
  }

  return range;
}
