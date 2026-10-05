import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getOutbox } from '../../../offline/localStore';
import { fetchIsOnline } from '../../../offline/network';
import { useOfflineOptional } from '../../../offline/OfflineContext';
import type { OutboxSaleItem } from '../../../offline/types';
import type { PaymentMethod, PaymentStatus } from '../../../types/domain';
import { addDays, startOfDay } from '../../../utils/dates';
import {
  daySectionKey,
  daySectionLabel,
  summarizeSaleItems,
} from '../../../utils/sales';

export type SalesStatusFilter = 'all' | PaymentStatus;

export type SalesListRow = {
  id: string;
  summary: string;
  customerId: string | null;
  customerName: string;
  created_at: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  total_amount: number;
  searchText: string;
  pending?: boolean;
  pendingFailed?: boolean;
};

export type SalesSection = {
  key: string;
  label: string;
  date: Date;
  count: number;
  sales: SalesListRow[];
};

export type TradeDay = {
  key: string;
  date: Date;
  label: string;
};

function localDayKey(date: Date) {
  const d = startOfDay(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function localNoonIso(date: Date) {
  const d = startOfDay(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function dayFromIso(iso: string) {
  return startOfDay(new Date(iso));
}

function makeTradeDay(date: Date): TradeDay {
  const day = startOfDay(date);
  return {
    key: localDayKey(day),
    date: day,
    label: daySectionLabel(localNoonIso(day)),
  };
}

function mapOutboxSale(item: OutboxSaleItem): SalesListRow {
  return {
    id: item.clientSaleId,
    summary: item.payload.itemSummary,
    customerId: item.payload.customerId,
    customerName: item.payload.customerName,
    created_at: item.createdAt,
    payment_status: item.payload.paymentStatus,
    payment_method: item.payload.paymentMethod,
    total_amount: item.payload.totalAmount,
    searchText:
      `${item.payload.itemSummary} ${item.payload.customerName}`.toLowerCase(),
    pending: item.status !== 'failed',
    pendingFailed: item.status === 'failed',
  };
}

function mapSale(sale: Record<string, unknown>): SalesListRow {
  const items = (sale.sale_items ?? []) as unknown as {
    quantity: number;
    product: { name: string } | { name: string }[] | null;
  }[];
  const customerRaw = sale.customer as unknown as
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
  const customer = Array.isArray(customerRaw)
    ? (customerRaw[0] ?? null)
    : customerRaw;
  const customerName = customer?.name?.trim() || 'Walk-in';
  const normalizedItems = items.map(item => ({
    quantity: item.quantity,
    product: Array.isArray(item.product)
      ? (item.product[0] ?? null)
      : item.product,
  }));
  const summary = summarizeSaleItems(normalizedItems);
  return {
    id: sale.id as string,
    summary,
    customerId: (sale.customer_id as string | null) ?? customer?.id ?? null,
    customerName,
    created_at: sale.created_at as string,
    payment_status: sale.payment_status as PaymentStatus,
    payment_method: (sale.payment_method as PaymentMethod | null) ?? null,
    total_amount: Number(sale.total_amount),
    searchText: `${summary} ${customerName}`.toLowerCase(),
  };
}

function uniqueTradeDays(timestamps: string[]): TradeDay[] {
  const seen = new Set<string>();
  const days: TradeDay[] = [];

  for (const iso of timestamps) {
    const date = dayFromIso(iso);
    const key = localDayKey(date);
    if (seen.has(key)) continue;
    seen.add(key);
    days.push(makeTradeDay(date));
  }

  return days;
}

/** Selected day + the previous traded day before it (if any). */
function windowForDate(selected: Date, tradeDays: TradeDay[]): TradeDay[] {
  const selectedDay = makeTradeDay(selected);
  const index = tradeDays.findIndex(day => day.key === selectedDay.key);

  if (index >= 0) {
    return tradeDays.slice(index, index + 2);
  }

  const older = tradeDays.find(day => day.date.getTime() < selectedDay.date.getTime());
  return older ? [selectedDay, older] : [selectedDay];
}

export function useSalesList(status: SalesStatusFilter, search: string) {
  const { shopId } = useAuth();
  const offline = useOfflineOptional();
  const [tradeDays, setTradeDays] = useState<TradeDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [hasUserPicked, setHasUserPicked] = useState(false);
  const [rows, setRows] = useState<SalesListRow[]>([]);
  const [pendingRows, setPendingRows] = useState<SalesListRow[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const daysRequestRef = useRef(0);

  const refreshPending = useCallback(async () => {
    if (!shopId) {
      setPendingRows([]);
      return;
    }
    const box = await getOutbox(shopId);
    setPendingRows(
      box
        .filter(i => i.status === 'pending' || i.status === 'syncing' || i.status === 'failed')
        .map(mapOutboxSale),
    );
  }, [shopId]);

  const windowDays = useMemo(
    () => windowForDate(selectedDate, tradeDays),
    [selectedDate, tradeDays],
  );

  const refreshTradeDays = useCallback(async () => {
    if (!shopId) {
      setTradeDays([]);
      setLoadingDays(false);
      return;
    }

    const requestId = ++daysRequestRef.current;
    setLoadingDays(true);
    await refreshPending();

    const online = await fetchIsOnline();
    if (!online) {
      const box = await getOutbox(shopId);
      const days = uniqueTradeDays(box.map(i => i.createdAt));
      const today = makeTradeDay(new Date());
      const merged =
        days.some(d => d.key === today.key) || box.length === 0
          ? days.length
            ? days
            : [today]
          : [today, ...days];
      setTradeDays(merged);
      setSelectedDate(prev => {
        if (hasUserPicked) return prev;
        return merged[0]?.date ?? startOfDay(new Date());
      });
      setLoadingDays(false);
      return;
    }

    let query = supabase
      .from('sales')
      .select('created_at')
      .eq('user_id', shopId)
      .order('created_at', { ascending: false })
      .limit(800);

    if (status !== 'all') {
      query = query.eq('payment_status', status);
    }

    const { data, error: queryError } = await query;

    if (requestId !== daysRequestRef.current) return;

    if (queryError) {
      setError(queryError.message);
      setTradeDays([]);
      setLoadingDays(false);
      return;
    }

    const box = await getOutbox(shopId);
    const days = uniqueTradeDays([
      ...(data ?? []).map(row => row.created_at),
      ...box.map(i => i.createdAt),
    ]);
    setTradeDays(days);
    setSelectedDate(prev => {
      if (hasUserPicked) return prev;
      return days[0]?.date ?? startOfDay(new Date());
    });
    setLoadingDays(false);
  }, [shopId, status, hasUserPicked, refreshPending]);

  const refreshSales = useCallback(async () => {
    if (!shopId) {
      setRows([]);
      setLoading(false);
      return;
    }

    await refreshPending();

    if (windowDays.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const online = await fetchIsOnline();
    if (!online) {
      setRows([]);
      setLoading(false);
      return;
    }

    const results = await Promise.all(
      windowDays.map(async day => {
        const from = startOfDay(day.date);
        const to = addDays(from, 1);
        let query = supabase
          .from('sales')
          .select(
            `
            id,
            customer_id,
            total_amount,
            payment_status,
            payment_method,
            created_at,
            customer:customers(id, name),
            sale_items(quantity, product:products(name))
          `,
          )
          .eq('user_id', shopId)
          .gte('created_at', from.toISOString())
          .lt('created_at', to.toISOString())
          .order('created_at', { ascending: false });

        if (status !== 'all') {
          query = query.eq('payment_status', status);
        }

        return query;
      }),
    );

    if (requestId !== requestIdRef.current) return;

    const firstError = results.find(result => result.error)?.error;
    if (firstError) {
      setError(firstError.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped = results
      .flatMap(result => result.data ?? [])
      .map(sale => mapSale(sale as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    setRows(mapped);
    setLoading(false);
  }, [shopId, status, windowDays, refreshPending]);

  useEffect(() => {
    setHasUserPicked(false);
  }, [shopId, status]);

  useEffect(() => {
    void refreshTradeDays();
  }, [refreshTradeDays]);

  useEffect(() => {
    void refreshSales();
  }, [refreshSales]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending, offline?.pendingCount, offline?.failedCount]);

  const refresh = useCallback(async () => {
    if (offline?.isOnline) {
      await offline.syncNow();
    }
    await refreshTradeDays();
    await refreshSales();
    await refreshPending();
  }, [refreshTradeDays, refreshSales, refreshPending, offline]);

  const pickDate = useCallback((date: Date) => {
    setHasUserPicked(true);
    setSelectedDate(startOfDay(date));
  }, []);

  const mergedRows = useMemo(() => {
    const filteredPending = pendingRows.filter(row => {
      if (status !== 'all' && row.payment_status !== status) return false;
      return windowDays.some(
        day => daySectionKey(row.created_at) === day.key,
      );
    });
    return [...filteredPending, ...rows].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [pendingRows, rows, status, windowDays]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mergedRows;
    return mergedRows.filter(row => row.searchText.includes(q));
  }, [mergedRows, search]);

  const sections = useMemo((): SalesSection[] => {
    return windowDays.map(day => {
      const sales = visibleRows.filter(
        sale => daySectionKey(sale.created_at) === day.key,
      );
      return {
        key: day.key,
        label: day.label,
        date: day.date,
        count: sales.length,
        sales,
      };
    });
  }, [windowDays, visibleRows]);

  return {
    rows: visibleRows,
    sections,
    tradeDays,
    windowDays,
    selectedDate,
    pickDate,
    earliestTrade: tradeDays[tradeDays.length - 1]?.date,
    latestTrade: startOfDay(new Date()),
    loading: loading || loadingDays,
    error,
    refresh,
  };
}
