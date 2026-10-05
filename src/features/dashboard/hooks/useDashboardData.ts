import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { addDays, startOfDay } from '../../../utils/dates';

export type RecentSaleRow = {
  id: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  summary: string;
  customer_name?: string | null;
};

export type DashboardData = {
  todaySales: number;
  yesterdaySales: number;
  todaySaleCount: number;
  totalOwed: number;
  overdueCount: number;
  productsInStock: number;
  lowStockCount: number;
  recentSales: RecentSaleRow[];
};

type DashboardRpc = {
  today_sales: number;
  total_owed: number;
  products_in_stock: number;
  low_stock_count: number;
  recent_sales: {
    id: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
    summary: string;
  }[];
};

const empty: DashboardData = {
  todaySales: 0,
  yesterdaySales: 0,
  todaySaleCount: 0,
  totalOwed: 0,
  overdueCount: 0,
  productsInStock: 0,
  lowStockCount: 0,
  recentSales: [],
};

export function useDashboardData() {
  const { profile, shopId } = useAuth();
  const threshold = profile?.low_stock_threshold ?? 5;
  const reminderDays = profile?.debt_reminder_days ?? 7;

  const [data, setData] = useState<DashboardData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setData(empty);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const todayStart = startOfDay(new Date());
    const yesterdayStart = startOfDay(addDays(new Date(), -1));

    const [summaryRes, yesterdayRes, todayCountRes, debtsRes] =
      await Promise.all([
        supabase.rpc('get_dashboard_summary', {
          p_today_start: todayStart.toISOString(),
          p_low_stock_threshold: threshold,
        }),
        supabase
          .from('sales')
          .select('total_amount')
          .eq('user_id', shopId)
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', todayStart.toISOString()),
        supabase
          .from('sales')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', shopId)
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('debts')
          .select('id, amount_owed, amount_paid, status, created_at')
          .eq('user_id', shopId)
          .eq('status', 'open'),
      ]);

    if (summaryRes.error) {
      setError(summaryRes.error.message);
      setLoading(false);
      return;
    }

    const row = summaryRes.data as DashboardRpc;
    const yesterdaySales = (yesterdayRes.data ?? []).reduce(
      (sum, s) => sum + Number(s.total_amount ?? 0),
      0,
    );

    const overdueCount = (debtsRes.data ?? []).filter(d => {
      const owed = Math.max(0, Number(d.amount_owed) - Number(d.amount_paid));
      if (owed <= 0) return false;
      const days = Math.floor(
        (todayStart.getTime() - new Date(d.created_at).getTime()) / 86_400_000,
      );
      return days >= reminderDays;
    }).length;

    setData({
      todaySales: Number(row.today_sales ?? 0),
      yesterdaySales,
      todaySaleCount: todayCountRes.count ?? 0,
      totalOwed: Number(row.total_owed ?? 0),
      overdueCount,
      productsInStock: Number(row.products_in_stock ?? 0),
      lowStockCount: Number(row.low_stock_count ?? 0),
      recentSales: (row.recent_sales ?? []).map(sale => ({
        id: sale.id,
        total_amount: Number(sale.total_amount),
        payment_status: sale.payment_status,
        created_at: sale.created_at,
        summary: sale.summary || 'Sale',
      })),
    });
    setLoading(false);
  }, [shopId, threshold, reminderDays]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
