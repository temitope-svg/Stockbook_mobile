import { Download, Plus, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { permissionsFor } from '../../auth/permissions';
import { useAuth } from '../../auth/AuthContext';
import { useOffline } from '../../offline/OfflineContext';
import { alertNeedsConnection } from '../../offline/requireOnline';
import { colors } from '../../theme/colors';
import {
  csvDateStamp,
  formatCsvDateTime,
  rowsToCsv,
  shareCsv,
} from '../../utils/csv';
import { formatSalesHeaderDate, paymentStatusLabel } from '../../utils/sales';
import { paymentMethodLabel } from '../../utils/paymentMethod';
import { SaleCard } from './components/SaleCard';
import { SalesFilterChips } from './components/SalesFilterChips';
import { WeekSummaryCard } from './components/WeekSummaryCard';
import { useSalesInsights } from './hooks/useSalesInsights';
import {
  useSalesList,
  type SalesSection,
  type SalesStatusFilter,
} from './hooks/useSalesList';
import type { SalesStackParamList } from './SalesStack';

type ListItem =
  | { type: 'section'; key: string; label: string; count: number }
  | { type: 'sale'; key: string; saleId: string };

function flattenSections(sections: SalesSection[]): ListItem[] {
  const items: ListItem[] = [];
  for (const section of sections) {
    items.push({
      type: 'section',
      key: `section-${section.key}`,
      label: section.label,
      count: section.count,
    });
    for (const sale of section.sales) {
      items.push({
        type: 'sale',
        key: sale.id,
        saleId: sale.id,
      });
    }
  }
  return items;
}

export function SalesScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const permissions = permissionsFor(role);
  const { isOnline } = useOffline();
  const navigation =
    useNavigation<NativeStackNavigationProp<SalesStackParamList>>();

  const [status, setStatus] = useState<SalesStatusFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const insights = useSalesInsights();
  const {
    rows,
    sections,
    selectedDate,
    pickDate,
    earliestTrade,
    latestTrade,
    loading,
    error,
    refresh,
  } = useSalesList(status, debouncedSearch);

  const saleById = useMemo(() => {
    const map = new Map(rows.map(row => [row.id, row]));
    return map;
  }, [rows]);

  const listItems = useMemo(() => flattenSections(sections), [sections]);

  async function onRefresh() {
    await Promise.all([refresh(), insights.refresh()]);
  }

  async function onExportCsv() {
    if (!isOnline) {
      alertNeedsConnection('CSV export');
      return;
    }
    if (!permissions.canExport) {
      Alert.alert('Export unavailable', 'Only owners and managers can export.');
      return;
    }
    if (rows.length === 0) {
      Alert.alert('Nothing to export', 'No sales match the current filters.');
      return;
    }
    const stamp = csvDateStamp();
    const headers = [
      'Date',
      'Customer',
      'Items',
      'Status',
      'Payment method',
      'Total (NGN)',
    ];
    const csv = rowsToCsv(
      headers,
      rows.map(sale => [
        formatCsvDateTime(sale.created_at),
        sale.customerName,
        sale.summary,
        paymentStatusLabel(sale.payment_status),
        paymentMethodLabel(sale.payment_method) ?? '',
        Math.round(sale.total_amount),
      ]),
    );
    await shareCsv(`stockbook-sales-${stamp}.csv`, csv);
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-start justify-between px-5 pt-2">
        <View className="min-w-0 flex-1 pr-3">
          <Text className="text-[28px] font-bold tracking-tight text-text">
            Sales
          </Text>
          <Text className="mt-1 text-[14px] text-text-muted">
            {formatSalesHeaderDate()}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search sales"
            className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
            onPress={() => {
              setSearchOpen(open => !open);
              if (searchOpen) setSearch('');
            }}
          >
            {searchOpen ? (
              <X color={colors.text} size={18} strokeWidth={1.8} />
            ) : (
              <Search color={colors.text} size={18} strokeWidth={1.8} />
            )}
          </Pressable>
          {permissions.canExport ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export sales"
              className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={() => void onExportCsv()}
            >
              <Download color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {searchOpen ? (
        <View className="mx-5 mt-3 flex-row items-center rounded-full bg-surface px-4 py-3">
          <Search color={colors.textSubtle} size={18} strokeWidth={1.8} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search product or customer"
            placeholderTextColor={colors.textSubtle}
            className="ml-2.5 flex-1 text-[15px] text-text"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}

      <View className="mt-4">
        <WeekSummaryCard data={insights.data} />
      </View>

      <View className="mt-4">
        <SalesFilterChips
          value={status}
          onChange={setStatus}
          selectedDate={selectedDate}
          minimumDate={earliestTrade}
          maximumDate={latestTrade}
          onPickDate={pickDate}
        />
      </View>

      {error ? (
        <Text className="mx-5 mt-3 text-[13px] text-danger">{error}</Text>
      ) : null}

      {loading && rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={item => item.key}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading && rows.length > 0}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <Text className="text-[16px] font-semibold text-text">
                No sales found
              </Text>
              <Text className="mt-2 text-center text-[14px] text-text-muted">
                {debouncedSearch || status !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Record a sale to see it here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return (
                <View className="mb-2 mt-3 flex-row items-end justify-between">
                  <Text className="text-[16px] font-bold text-text">
                    {item.label}
                  </Text>
                  <Text className="text-[13px] text-text-subtle">
                    {item.count} sale{item.count === 1 ? '' : 's'}
                  </Text>
                </View>
              );
            }

            const sale = saleById.get(item.saleId);
            if (!sale) return null;
            return (
              <View className="mb-2">
                <SaleCard
                  sale={sale}
                  onPress={() =>
                    navigation.navigate('SaleDetail', {
                      saleId: sale.id,
                      pending: Boolean(sale.pending || sale.pendingFailed),
                    })
                  }
                />
              </View>
            );
          }}
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Record sale"
        className="absolute right-5 h-14 w-14 items-center justify-center rounded-[20px] bg-accent shadow-lg shadow-black/20 active:opacity-90"
        style={{ bottom: 20 }}
        onPress={() => navigation.navigate('RecordSale')}
      >
        <Plus color={colors.white} size={26} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
