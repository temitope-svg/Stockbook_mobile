import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';

export type Supplier = {
  id: string;
  name: string;
};

export function useSuppliers() {
  const { shopId } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('user_id', shopId)
      .order('name', { ascending: true });

    setSuppliers((data as Supplier[]) ?? []);
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { suppliers, loading, refresh };
}
