import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { NotificationItem } from './useNotifications';

type ReadMap = Record<string, string>;

async function fetchReads(userId: string): Promise<ReadMap> {
  const { data, error } = await supabase
    .from('notification_reads')
    .select('notification_key, fingerprint')
    .eq('user_id', userId);

  if (error) throw error;

  const map: ReadMap = {};
  for (const row of data ?? []) {
    map[row.notification_key] = row.fingerprint;
  }
  return map;
}

export function useNotificationReads(
  userId: string | null | undefined,
  items: NotificationItem[],
) {
  const [reads, setReads] = useState<ReadMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setReads({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const map = await fetchReads(userId);
        if (!cancelled) setReads(map);
      } catch {
        if (!cancelled) setReads({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || items.length === 0 || Object.keys(reads).length === 0) return;

    const active = new Set(items.map(item => item.id));
    const stale = Object.keys(reads).filter(key => !active.has(key));
    if (stale.length === 0) return;

    void (async () => {
      const { error } = await supabase
        .from('notification_reads')
        .delete()
        .eq('user_id', userId)
        .in('notification_key', stale);
      if (error) return;
      setReads(prev => {
        const next = { ...prev };
        for (const key of stale) delete next[key];
        return next;
      });
    })();
  }, [userId, items, reads]);

  const isRead = useCallback(
    (item: NotificationItem) => reads[item.id] === item.fingerprint,
    [reads],
  );

  const markRead = useCallback(
    async (item: NotificationItem) => {
      if (!userId) return;
      setReads(prev => ({ ...prev, [item.id]: item.fingerprint }));
      const { error } = await supabase.from('notification_reads').upsert(
        {
          user_id: userId,
          notification_key: item.id,
          fingerprint: item.fingerprint,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,notification_key' },
      );
      if (error) {
        const map = await fetchReads(userId);
        setReads(map);
      }
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId || items.length === 0) return;
    const next: ReadMap = { ...reads };
    for (const item of items) next[item.id] = item.fingerprint;
    setReads(next);

    const { error } = await supabase.from('notification_reads').upsert(
      items.map(item => ({
        user_id: userId,
        notification_key: item.id,
        fingerprint: item.fingerprint,
        read_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,notification_key' },
    );
    if (error) {
      const map = await fetchReads(userId);
      setReads(map);
    }
  }, [userId, items, reads]);

  const unreadCount = useMemo(
    () => items.reduce((count, item) => count + (isRead(item) ? 0 : 1), 0),
    [items, isRead],
  );

  return {
    isRead,
    markRead,
    markAllRead,
    unreadCount,
    loading,
  };
}
