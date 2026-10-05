export function formatRelativeTime(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

export type NotificationTimeGroup = 'today' | 'week' | 'earlier';

export function notificationTimeGroup(
  iso: string,
  now = new Date(),
): NotificationTimeGroup {
  const then = new Date(iso);
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  if (then >= startToday) return 'today';

  const startWeek = new Date(startToday);
  startWeek.setDate(startWeek.getDate() - 6);
  if (then >= startWeek) return 'week';

  return 'earlier';
}

export const NOTIFICATION_GROUP_LABELS: Record<NotificationTimeGroup, string> = {
  today: 'Today',
  week: 'Earlier this week',
  earlier: 'Earlier',
};
