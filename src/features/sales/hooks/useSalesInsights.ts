import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { startOfDay } from '../../../utils/dates';
import { percentChange } from '../../../utils/sales';

export type DayBucket = {
  key: string;
  label: string;
  total: number;
};

export type SalesInsights = {
  weekTotal: number;
  weekDelta: number;
  chart7: DayBucket[];
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function shortWeekday(date: Date) {
  return date.toLocaleDateString('en-NG', { weekday: 'short' });
}

function mapChart(
  points: { at: string; total: number }[] | null | undefined,
): DayBucket[] {
  return (points ?? []).map(point => {
    const date = new Date(point.at);
    return {
      key: dayKey(date),
      label: shortWeekday(date),
      total: Number(point.total) || 0,
    };
  });
}

type SalesInsightsRpc = {
  week_total: number;
  today_total: number;
  yesterday_total: number;
  chart_7: { at: string; total: number }[];
};

export function useSalesInsights() {
  const { shopId } = useAuth();
  const [data, setData] = useState<SalesInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const today = startOfDay(new Date());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: raw, error: rpcError } = await supabase.rpc(
      'get_sales_insights',
      {
        p_today_start: today.toISOString(),
        p_month_start: monthStart.toISOString(),
      },
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    const row = raw as SalesInsightsRpc;
    setData({
      weekTotal: Number(row.week_total) || 0,
      weekDelta: percentChange(
        Number(row.today_total) || 0,
        Number(row.yesterday_total) || 0,
      ),
      chart7: mapChart(row.chart_7),
    });
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
