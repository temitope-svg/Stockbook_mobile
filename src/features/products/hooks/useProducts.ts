import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  getCachedProducts,
  setCachedProducts,
  setLastSyncAt,
} from '../../../offline/localStore';
import { fetchIsOnline } from '../../../offline/network';
import type { Product } from '../../../types/domain';
import {
  mergeCategoryLists,
  normalizeCategorySettings,
  resolveCategories,
} from '../../../utils/productCategories';

export type ProductSort = 'newest' | 'name' | 'stock_low' | 'stock_high';

export type ProductListQuery = {
  archived?: boolean;
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
  sort?: ProductSort;
};

export const PRODUCTS_PAGE_SIZE = 10;

const PRODUCT_COLUMNS =
  'id, user_id, name, category, cost_price, selling_price, quantity, low_stock_threshold, image_url, imei, condition, variant, custom_fields, is_active, created_at, updated_at';

function sanitizeSearch(value: string) {
  return value.replace(/[%_,.()*\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

type ProductStats = {
  lowStockCount: number;
  totalUnits: number;
  catalogCount: number;
};

const EMPTY_STATS: ProductStats = {
  lowStockCount: 0,
  totalUnits: 0,
  catalogCount: 0,
};

function filterCachedProducts(
  all: Product[],
  {
    archived,
    search,
    category,
    lowStockOnly,
    sort,
    threshold,
  }: {
    archived: boolean;
    search: string;
    category: string;
    lowStockOnly: boolean;
    sort: ProductSort;
    threshold: number;
  },
): Product[] {
  const q = sanitizeSearch(search).toLowerCase();
  let list = all.filter(p => p.is_active === !archived);

  if (q) {
    list = list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.variant ?? '').toLowerCase().includes(q) ||
        (p.imei ?? '').toLowerCase().includes(q),
    );
  }
  if (category) list = list.filter(p => p.category === category);
  if (lowStockOnly) {
    list = list.filter(
      p => p.quantity <= (p.low_stock_threshold ?? threshold),
    );
  }

  return [...list].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'stock_low') return a.quantity - b.quantity;
    if (sort === 'stock_high') return b.quantity - a.quantity;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export function useProducts({
  archived = false,
  search = '',
  category = '',
  lowStockOnly = false,
  sort = 'newest',
}: ProductListQuery = {}) {
  const { profile, shopId } = useAuth();
  const threshold = profile?.low_stock_threshold ?? 5;

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductStats>(EMPTY_STATS);
  const [fromCache, setFromCache] = useState(false);

  const requestIdRef = useRef(0);
  const pageSize = PRODUCTS_PAGE_SIZE;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalCount);

  const categories = useMemo(() => {
    const businessType = profile?.business_type ?? 'general';
    const settings = normalizeCategorySettings(profile?.category_settings);
    const enabled = resolveCategories(businessType, settings);
    const fromRows = products
      .map(p => p.category?.trim() ?? '')
      .filter(Boolean);
    return mergeCategoryLists(enabled, fromRows);
  }, [products, profile?.business_type, profile?.category_settings]);

  const applyCachedPage = useCallback(
    async (nextPage: number) => {
      if (!shopId) return false;
      const cached = await getCachedProducts(shopId);
      if (cached.length === 0) return false;

      const filtered = filterCachedProducts(cached, {
        archived,
        search,
        category,
        lowStockOnly,
        sort,
        threshold,
      });
      const total = filtered.length;
      const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
      const pageNum = Math.min(Math.max(nextPage, 1), maxPage);
      const from = (pageNum - 1) * pageSize;
      const slice = filtered.slice(from, from + pageSize);

      setProducts(slice);
      setTotalCount(total);
      setPage(pageNum);
      setFromCache(true);
      setStats({
        catalogCount: cached.filter(p => p.is_active === !archived).length,
        lowStockCount: cached.filter(
          p =>
            p.is_active === !archived &&
            p.quantity <= (p.low_stock_threshold ?? threshold),
        ).length,
        totalUnits: cached
          .filter(p => p.is_active === !archived)
          .reduce((sum, p) => sum + p.quantity, 0),
      });
      setLoading(false);
      return true;
    },
    [
      shopId,
      archived,
      search,
      category,
      lowStockOnly,
      sort,
      threshold,
      pageSize,
    ],
  );

  const fetchStats = useCallback(async () => {
    if (!shopId) {
      setStats(EMPTY_STATS);
      return;
    }

    const online = await fetchIsOnline();
    if (!online) return;

    const [countRes, lowRes, sumRes] = await Promise.all([
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', shopId)
        .eq('is_active', !archived),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', shopId)
        .eq('is_active', !archived)
        .lte('quantity', threshold),
      supabase
        .from('products')
        .select('quantity.sum()')
        .eq('user_id', shopId)
        .eq('is_active', !archived),
    ]);

    let totalUnits = 0;
    if (!sumRes.error && Array.isArray(sumRes.data) && sumRes.data[0]) {
      const row = sumRes.data[0] as Record<string, unknown>;
      const raw = row.sum ?? row['quantity.sum'] ?? Object.values(row)[0];
      totalUnits = Number(raw ?? 0);
    }

    setStats({
      catalogCount: countRes.count ?? 0,
      lowStockCount: lowRes.count ?? 0,
      totalUnits: Number.isFinite(totalUnits) ? totalUnits : 0,
    });
  }, [shopId, archived, threshold]);

  const buildPageQuery = useCallback(
    (from: number, to: number) => {
      let query = supabase
        .from('products')
        .select(PRODUCT_COLUMNS, { count: 'exact' })
        .eq('user_id', shopId as string)
        .eq('is_active', !archived);

      const q = sanitizeSearch(search);
      if (q) {
        query = query.or(
          `name.ilike.%${q}%,category.ilike.%${q}%,variant.ilike.%${q}%,imei.ilike.%${q}%`,
        );
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (lowStockOnly) {
        query = query.lte('quantity', threshold);
      }

      if (sort === 'name') {
        query = query.order('name', { ascending: true });
      } else if (sort === 'stock_low') {
        query = query.order('quantity', { ascending: true });
      } else if (sort === 'stock_high') {
        query = query.order('quantity', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      return query.range(from, to);
    },
    [shopId, archived, search, category, lowStockOnly, sort, threshold],
  );

  const fetchPage = useCallback(
    async (nextPage: number) => {
      if (!shopId) {
        setProducts([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      const online = await fetchIsOnline();
      if (!online) {
        const ok = await applyCachedPage(nextPage);
        if (!ok) {
          setProducts([]);
          setTotalCount(0);
          setFromCache(false);
          setError('Connect once to download your shop products.');
          setLoading(false);
        }
        return;
      }

      const from = (nextPage - 1) * pageSize;
      const { data, error: queryError, count } = await buildPageQuery(
        from,
        from + pageSize - 1,
      );

      if (requestId !== requestIdRef.current) return;

      if (queryError) {
        const ok = await applyCachedPage(nextPage);
        if (!ok) {
          setError(queryError.message);
          setProducts([]);
          setTotalCount(0);
          setFromCache(false);
          setLoading(false);
        }
        return;
      }

      const rows = (data as Product[]) ?? [];
      const total = count ?? rows.length;
      const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);

      if (total > 0 && nextPage > maxPage) {
        setPage(maxPage);
        return;
      }

      setProducts(rows);
      setTotalCount(total);
      setFromCache(false);
      setLoading(false);

      // Keep full active catalog warm for offline / sale screen
      void (async () => {
        const { data: all } = await supabase
          .from('products')
          .select(PRODUCT_COLUMNS)
          .eq('user_id', shopId)
          .eq('is_active', true)
          .order('name', { ascending: true });
        if (all) {
          await setCachedProducts(shopId, all as Product[]);
          await setLastSyncAt(shopId, new Date().toISOString());
        }
      })();
    },
    [shopId, buildPageQuery, pageSize, applyCachedPage],
  );

  const filterKey = `${archived}|${search}|${category}|${lowStockOnly}|${sort}`;
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setPage(1);
    }
  }, [filterKey]);

  useEffect(() => {
    void fetchPage(page);
  }, [fetchPage, page, filterKey]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchPage(page), fetchStats()]);
  }, [fetchPage, page, fetchStats]);

  const goToPage = useCallback(
    (next: number) => {
      setPage(Math.min(Math.max(next, 1), totalPages));
    },
    [totalPages],
  );

  return {
    products,
    page: safePage,
    totalPages,
    totalCount,
    start,
    end,
    pageSize,
    categories,
    lowStockCount: stats.lowStockCount,
    totalUnits: stats.totalUnits,
    catalogCount: stats.catalogCount,
    threshold,
    loading,
    error,
    refresh,
    goToPage,
    fromCache,
  };
}
