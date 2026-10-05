export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

/** Compact display for rankings, e.g. ₦3.84M */
export function formatCompactNaira(amount: number): string {
  const n = Math.abs(amount);
  if (n >= 1_000_000) {
    const value = amount / 1_000_000;
    const text =
      value >= 10 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, '');
    return `₦${text}M`;
  }
  if (n >= 1_000) {
    const value = amount / 1_000;
    const text =
      value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');
    return `₦${text}K`;
  }
  return formatNaira(amount);
}

