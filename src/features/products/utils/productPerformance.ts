import type { ProductSaleRow, StockMovementView } from '../hooks/useProductDetail';

export type ChartPeriod = '7d' | '30d' | '90d';

export function periodStart(period: ChartPeriod, now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const days = period === '7d' ? 6 : period === '30d' ? 29 : 89;
  d.setDate(d.getDate() - days);
  return d;
}

export function filterSalesForChart(
  sales: ProductSaleRow[],
  period: ChartPeriod,
) {
  const since = periodStart(period);
  return sales.filter(sale => new Date(sale.created_at) >= since);
}

export function summarizePeriodSales(
  sales: ProductSaleRow[],
  costPrice: number,
) {
  const soldQty = sales.reduce((sum, s) => sum + s.quantity, 0);
  const revenue = sales.reduce(
    (sum, s) => sum + s.quantity * s.unitPrice,
    0,
  );
  const profit = sales.reduce(
    (sum, s) => sum + (s.unitPrice - costPrice) * s.quantity,
    0,
  );
  return { soldQty, revenue, profit };
}

export function movementTitle(move: StockMovementView): string {
  if (move.reason === 'sale') {
    return move.customerName
      ? `Sold to ${move.customerName}`
      : 'Sold · Walk-in';
  }
  if (move.reason === 'restock') {
    return move.note
      ? `Restocked · ${move.note}`
      : 'Restocked';
  }
  if (move.reason === 'opening') return 'Added to shop';
  return move.note ? `Adjusted · ${move.note}` : 'Adjusted';
}

export function formatMovementWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const time = date.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (date >= startToday) return `Today, ${time}`;
  if (date >= startYesterday) return `Yesterday, ${time}`;
  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Build a simple daily qty series for the chart. */
export function salesChartPoints(
  sales: ProductSaleRow[],
  period: ChartPeriod,
): number[] {
  const since = periodStart(period);
  const days = period === '7d' ? 7 : period === '30d' ? 14 : 18;
  const buckets = Array.from({ length: days }, () => 0);
  const msPerBucket =
    (Date.now() - since.getTime()) / Math.max(days, 1);

  for (const sale of sales) {
    const t = new Date(sale.created_at).getTime();
    if (t < since.getTime()) continue;
    const index = Math.min(
      days - 1,
      Math.max(0, Math.floor((t - since.getTime()) / msPerBucket)),
    );
    buckets[index] = (buckets[index] ?? 0) + sale.quantity;
  }
  return buckets;
}
