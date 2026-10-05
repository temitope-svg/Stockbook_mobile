import { addDays, startOfDay } from './dates';

export function summarizeSaleItems(
  items: { quantity: number; product: { name: string } | null }[],
): string {
  if (items.length === 0) return 'Sale';
  const first = items[0]!;
  const name = first.product?.name ?? 'Sale';
  const qty = first.quantity;
  const extra = items.length > 1 ? ` +${items.length - 1}` : '';
  if (qty > 1) return `${name} × ${qty}${extra}`;
  return `${name}${extra}`;
}

export function formatSalesHeaderDate(date = new Date()) {
  return date.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatSaleTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSaleReceiptDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

export function saleShortId(id: string) {
  const digits = id.replace(/\D/g, '').slice(-4);
  return digits || id.slice(0, 4).toUpperCase();
}

export function customerInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
}

export function daySectionLabel(iso: string, now = new Date()) {
  const date = new Date(iso);
  const today = startOfDay(now);
  const yesterday = addDays(today, -1);
  const day = startOfDay(date);

  if (day.getTime() === today.getTime()) return 'Today';
  if (day.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function daySectionKey(iso: string) {
  const d = startOfDay(new Date(iso));
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function paymentStatusLabel(status: string) {
  if (status === 'paid') return 'Paid';
  if (status === 'credit') return 'On credit';
  if (status === 'partial') return 'Partial';
  return status;
}
