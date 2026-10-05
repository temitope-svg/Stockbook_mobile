import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  getCachedProducts,
  setCachedProducts,
  setLastSyncAt,
} from '../../../offline/localStore';
import { fetchIsOnline } from '../../../offline/network';
import type { Product } from '../../../types/domain';

const PRODUCT_COLUMNS =
  'id, user_id, name, category, cost_price, selling_price, quantity, low_stock_threshold, image_url, imei, condition, variant, custom_fields, is_active, created_at, updated_at';

/** All active products for recording a sale (not paginated). */
export function useSaleCatalog() {
  const { shopId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const refresh = useCallback(async () => {
    if (!shopId) {
      setProducts([]);
      setLoading(false);
      setFromCache(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Always show local snapshot first so offline / flaky network still works.
    const cached = await getCachedProducts(shopId);
    if (cached.length > 0) {
      setProducts(cached);
      setFromCache(true);
      setLoading(false);
    }

    const online = await fetchIsOnline();
    if (!online) {
      if (cached.length === 0) {
        setProducts([]);
        setFromCache(true);
        setError('Connect once to download your shop products.');
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('user_id', shopId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (queryError) {
        if (cached.length === 0) {
          setError(queryError.message);
          setProducts([]);
          setFromCache(false);
          setLoading(false);
        }
        return;
      }

      const rows = (data as Product[]) ?? [];
      setProducts(rows);
      setFromCache(false);
      setError(null);
      await setCachedProducts(shopId, rows);
      await setLastSyncAt(shopId, new Date().toISOString());
      setLoading(false);
    } catch {
      if (cached.length === 0) {
        setError('Connect once to download your shop products.');
        setProducts([]);
        setFromCache(true);
        setLoading(false);
      }
      // else keep cached products already shown
    }
  }, [shopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { products, loading, error, refresh, fromCache };
}
