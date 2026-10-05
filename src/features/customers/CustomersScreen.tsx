import { Search, UserPlus, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useOffline } from '../../offline/OfflineContext';
import { alertNeedsConnection } from '../../offline/requireOnline';
import { colors } from '../../theme/colors';
import { AddCustomerSheet } from './components/AddCustomerSheet';
import { CustomerCard } from './components/CustomerCard';
import { CustomersFilterChips } from './components/CustomersFilterChips';
import { CustomersSummaryCards } from './components/CustomersSummaryCards';
import { TopCustomersStrip } from './components/TopCustomersStrip';
import {
  filterCustomers,
  useCustomerLedger,
  type CustomerFilter,
} from './hooks/useCustomerLedger';
import { useCustomerRankings } from './hooks/useCustomerRankings';
import type { CustomersStackParamList } from './CustomersStack';

export function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<CustomersStackParamList>>();

  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const ledger = useCustomerLedger();
  const rankings = useCustomerRankings();
  const { isOnline } = useOffline();

  const customers = useMemo(
    () => filterCustomers(ledger.rows, debouncedSearch, filter),
    [ledger.rows, debouncedSearch, filter],
  );

  async function onRefresh() {
    await Promise.all([ledger.refresh(), rankings.refresh()]);
  }

  const summary = `${ledger.stats.totalCustomers} customer${
    ledger.stats.totalCustomers === 1 ? '' : 's'
  } · ${ledger.stats.customersWithDebt} owe you`;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-start justify-between px-5 pt-2">
        <View className="min-w-0 flex-1 pr-3">
          <Text className="text-[28px] font-bold tracking-tight text-text">
            Customers
          </Text>
          <Text className="mt-1 text-[14px] text-text-muted">{summary}</Text>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search customers"
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add customer"
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-90"
            onPress={() => {
              if (!isOnline) {
                alertNeedsConnection('Adding a customer');
                return;
              }
              setAddOpen(true);
            }}
          >
            <UserPlus color={colors.white} size={18} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {searchOpen ? (
        <View className="mx-5 mt-3 flex-row items-center rounded-full bg-surface px-4 py-3">
          <Search color={colors.textSubtle} size={18} strokeWidth={1.8} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or phone"
            placeholderTextColor={colors.textSubtle}
            className="ml-2.5 flex-1 text-[15px] text-text"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}

      {ledger.error ? (
        <Text className="mx-5 mt-3 text-[13px] text-danger">{ledger.error}</Text>
      ) : null}

      {ledger.loading && ledger.rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingBottom: 28,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={ledger.loading && ledger.rows.length > 0}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View className="pb-3 pt-4">
              <CustomersSummaryCards
                totalOwed={ledger.stats.totalOwed}
                overdueCount={ledger.stats.overdueCount}
              />
              <TopCustomersStrip
                rows={rankings.rows}
                onPress={id =>
                  navigation.navigate('CustomerDetail', { customerId: id })
                }
              />
              <View className="mt-5">
                <CustomersFilterChips
                  value={filter}
                  owesCount={ledger.stats.customersWithDebt}
                  overdueCount={ledger.stats.overdueCount}
                  onChange={setFilter}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <Text className="text-[16px] font-semibold text-text">
                No customers found
              </Text>
              <Text className="mt-2 text-center text-[14px] text-text-muted">
                {debouncedSearch || filter !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Tap + to add your first customer.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-2 px-5">
              <CustomerCard
                customer={item}
                onPress={() =>
                  navigation.navigate('CustomerDetail', {
                    customerId: item.id,
                  })
                }
              />
            </View>
          )}
        />
      )}

      <AddCustomerSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={id => {
          void ledger.refresh();
          navigation.navigate('CustomerDetail', { customerId: id });
        }}
      />
    </View>
  );
}
