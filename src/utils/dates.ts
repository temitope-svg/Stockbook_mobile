export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

export function todayValue() {
  return toDateInputValue(new Date());
}

/** e.g. "1–15 Aug" or "12 Jan – 3 Feb" */
export function formatShortDateRange(dateFrom: string, dateTo: string) {
  const from = parseDateInput(dateFrom);
  const to = parseDateInput(dateTo);
  const sameMonth =
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear();

  if (dateFrom === dateTo) {
    return from.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }

  if (sameMonth) {
    return `${from.getDate()}–${to.getDate()} ${to.toLocaleDateString('en-NG', {
      month: 'short',
    })}`;
  }

  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${from.toLocaleDateString('en-NG', opts)} – ${to.toLocaleDateString(
    'en-NG',
    opts,
  )}`;
}
