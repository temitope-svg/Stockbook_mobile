import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';

export function useTeamCount() {
  const { shopId } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shopId) {
      setCount(0);
      return;
    }

    let cancelled = false;
    (async () => {
      const { count: next, error } = await supabase
        .from('shop_members')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .eq('status', 'active');

      if (!cancelled && !error) setCount(next ?? 0);
    })();

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  return count;
}
