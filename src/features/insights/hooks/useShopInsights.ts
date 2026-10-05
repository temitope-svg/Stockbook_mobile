import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { permissionsFor } from '../../../auth/permissions';
import { supabase } from '../../../lib/supabase';
import { addDays, parseDateInput } from '../../../utils/dates';

export type InsightsChartPoint = {
  key: string;
  label: string;
  total: number;
};

export type InsightsProductRank = {
  id: string;
  name: string;
  soldQty: number;
  revenue: number;
  profit?: number;
  quantity?: number;
  costPrice?: number;
};

export type ShopInsights = {
  revenue: number;
  profit: number;
  restockSpend: number;
  salesCount: number;
  chart: InsightsChartPoint[];
  topProfit: InsightsProductRank[];
  slowMovers: InsightsProductRank[];
};

type ShopInsightsRpc = {
  revenue: number;
  profit: number;
  restock_spend: number;
  sales_count: number;
  chart: { at: string; total: number }[];
  top_profit: {
    id: string;
    name: string;
    sold_qty: number;
    revenue: number;
    profit: number;
  }[];
  slow_movers: {
    id: string;
    name: string;
    sold_qty: number;
    revenue: number;
  }[];
};

function chartLabel(at: string, weekly: boolean, dayCount: number) {
  const date = new Date(at);
  if (weekly || dayCount > 7) {
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('en-NG', { weekday: 'short' });
}

function mapChart(
  points: { at: string; total: number }[] | null | undefined,
  weekly: boolean,
  dayCount: number,
): InsightsChartPoint[] {
  return (points ?? []).map(point => {
    const date = new Date(point.at);
    return {
      key: date.toISOString(),
      label: chartLabel(point.at, weekly, dayCount),
      total: Number(point.total) || 0,
    };
  });
}

export function insightsRange(dateFrom: string, dateTo: string) {
  const from = parseDateInput(dateFrom);
  const to = addDays(parseDateInput(dateTo), 1);
  const dayCount = Math.max(
    Math.ceil((to.getTime() - from.getTime()) / 86_400_000),
    1,
  );
  return { from, to, weekly: dayCount > 45, dayCount };
}

async function fetchInsights(
  from: Date,
  to: Date,
  weekly: boolean,
  dayCount: number,
): Promise<ShopInsights> {
  const { data, error } = await supabase.rpc('get_shop_insights', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;

  const row = data as ShopInsightsRpc;
  const slowMovers = (row.slow_movers ?? []).map(p => ({
    id: p.id,
    name: p.name,
    soldQty: Number(p.sold_qty) || 0,
    revenue: Number(p.revenue) || 0,
  }));

  const slowIds = slowMovers.map(p => p.id);
  let stockById = new Map<string, { quantity: number; costPrice: number }>();
  if (slowIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, quantity, cost_price')
      .in('id', slowIds);
    stockById = new Map(
      (products ?? []).map(p => [
        p.id as string,
        {
          quantity: Number(p.quantity) || 0,
          costPrice: Number(p.cost_price) || 0,
        },
      ]),
    );
  }

  return {
    revenue: Number(row.revenue) || 0,
    profit: Number(row.profit) || 0,
    restockSpend: Number(row.restock_spend) || 0,
    salesCount: Number(row.sales_count) || 0,
    chart: mapChart(row.chart, weekly, dayCount),
    topProfit: (row.top_profit ?? []).map(p => ({
      id: p.id,
      name: p.name,
      soldQty: Number(p.sold_qty) || 0,
      revenue: Number(p.revenue) || 0,
      profit: Number(p.profit) || 0,
    })),
    slowMovers: slowMovers.map(p => {
      const stock = stockById.get(p.id);
      return {
        ...p,
        quantity: stock?.quantity ?? 0,
        costPrice: stock?.costPrice ?? 0,
      };
    }),
  };
}

const EMPTY: ShopInsights = {
  revenue: 0,
  profit: 0,
  restockSpend: 0,
  salesCount: 0,
  chart: [],
  topProfit: [],
  slowMovers: [],
};

export function useShopInsights(dateFrom: string, dateTo: string) {
  const { shopId, role } = useAuth();
  const canView = permissionsFor(role).canViewCost;
  const range = useMemo(
    () => insightsRange(dateFrom, dateTo),
    [dateFrom, dateTo],
  );

  const [data, setData] = useState<ShopInsights>(EMPTY);
  const [previousRevenue, setPreviousRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!shopId || !canView || !dateFrom || !dateTo) {
        setData(EMPTY);
        setPreviousRevenue(null);
        setLoading(false);
        setReady(true);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const current = await fetchInsights(
          range.from,
          range.to,
          range.weekly,
          range.dayCount,
        );
        setData(current);

        const prevTo = range.from;
        const prevFrom = addDays(prevTo, -range.dayCount);
        try {
          const previous = await fetchInsights(
            prevFrom,
            prevTo,
            range.weekly,
            range.dayCount,
          );
          setPreviousRevenue(previous.revenue);
        } catch {
          setPreviousRevenue(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Couldn’t load insights';
        setError(msg);
        setData(EMPTY);
        setPreviousRevenue(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setReady(true);
      }
    },
    [shopId, canView, dateFrom, dateTo, range],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const revenueChangePct = useMemo(() => {
    if (previousRevenue == null || previousRevenue <= 0) return null;
    if (data.revenue <= 0 && previousRevenue <= 0) return null;
    return Math.round(
      ((data.revenue - previousRevenue) / previousRevenue) * 100,
    );
  }, [data.revenue, previousRevenue]);

  return {
    data,
    weekly: range.weekly,
    dayCount: range.dayCount,
    loading,
    refreshing,
    ready,
    error,
    revenueChangePct,
    refresh: () => load(true),
  };
}
