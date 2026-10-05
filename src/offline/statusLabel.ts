export function formatLastSynced(iso: string | null, now = new Date()): string {
  if (!iso) return 'Not synced yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not synced yet';
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function syncBadgeLabel(opts: {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
}): string {
  if (!opts.isOnline) {
    if (opts.pendingCount > 0) return `Offline · ${opts.pendingCount} pending`;
    return 'Offline';
  }
  if (opts.failedCount > 0) return `${opts.failedCount} sync issue${opts.failedCount === 1 ? '' : 's'}`;
  if (opts.pendingCount > 0) return `Syncing ${opts.pendingCount}…`;
  return 'Synced';
}
