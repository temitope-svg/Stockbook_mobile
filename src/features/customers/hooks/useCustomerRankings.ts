import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { startOfDay } from '../../../utils/dates';

export type CustomerRankRow = {
  id: string;
  name: string;
  photoUrl: string | null;
  spend: number;
  visits: number;
};

type RankRpcRow = {
  id: string;
  name: string;
  photo_url: string | null;
  spend: number;
  visits: number;
};

type RankingsRpc = {
  month: RankRpcRow[];
};

export function useCustomerRankings() {
  const { shopId } = useAuth();
  const [rows, setRows] = useState<CustomerRankRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = startOfDay(new Date());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const { data, error } = await supabase.rpc('get_customer_rankings', {
      p_today_start: today.toISOString(),
      p_month_start: monthStart.toISOString(),
      p_year_start: yearStart.toISOString(),
      p_limit: 5,
    });

    if (error) {
      setRows([]);
      setLoading(false);
      return;
    }

    const month = ((data as RankingsRpc)?.month ?? []).map(row => ({
      id: row.id,
      name: row.name,
      photoUrl: row.photo_url ?? null,
      spend: Number(row.spend) || 0,
      visits: Number(row.visits) || 0,
    }));

    setRows(month);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}
