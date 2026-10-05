export const DEFAULT_DEBT_REMINDER_DAYS = 7;

export function daysSince(iso: string, now = new Date()): number {
  const then = new Date(iso);
  const ms = startOfLocalDay(now).getTime() - startOfLocalDay(then).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isDebtOverdue(days: number, reminderDays: number): boolean {
  return days >= Math.max(1, reminderDays);
}

/** Follow-up cycle index so a read debt can resurface on the next window. */
export function debtFollowUpCycle(
  days: number,
  reminderDays = DEFAULT_DEBT_REMINDER_DAYS,
) {
  const cadence = Math.max(1, reminderDays);
  if (days < cadence) return 0;
  return Math.floor(days / cadence);
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  const local = digits.startsWith('234') ? `0${digits.slice(3)}` : digits;
  const start = local.slice(0, 4);
  const end = local.slice(-4);
  return `${start} ${end.slice(0, 3)} ${end.slice(3)}`.replace(
    /(\d{4})\s(\d{3})\s(\d{4})/,
    '$1 $2 $3',
  );
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return 'No phone';
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('234') ? `0${digits.slice(3)}` : digits;
  if (local.length === 11) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return phone;
}

const AVATAR_TONES = [
  { bg: 'bg-danger-tint', text: 'text-danger' },
  { bg: 'bg-accent-tint', text: 'text-accent' },
  { bg: 'bg-primary-tint', text: 'text-primary' },
  { bg: 'bg-teal-tint', text: 'text-teal' },
  { bg: 'bg-[#eef2ff]', text: 'text-[#4338ca]' },
] as const;

export function avatarTone(name: string, overdue = false) {
  if (overdue) return AVATAR_TONES[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length]!;
}

export function formatRelativeVisit(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const days = daysSince(iso);
  if (days === 0) return 'Last visit today';
  if (days === 1) return 'Last visit yesterday';
  if (days < 7) return `Last visit ${days} days ago`;
  if (days < 14) return 'Last visit 1 week ago';
  return `Last visit ${Math.floor(days / 7)} weeks ago`;
}

export function formatLastVisitShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const days = daysSince(iso);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}
