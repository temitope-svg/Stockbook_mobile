import { ArrowUpDown, Plus, Search } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
import { Pagination } from '../../components/ui/Pagination';
import { useOffline } from '../../offline/OfflineContext';
import { alertNeedsConnection } from '../../offline/requireOnline';
import { colors } from '../../theme/colors';
import { ProductCard } from './components/ProductCard';
import {
  ProductFilterChips,
  type ProductFilter,
} from './components/ProductFilterChips';
import { useProducts, type ProductSort } from './hooks/useProducts';
import type { ProductsStackParamList } from './ProductsStack';

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'stock_low', label: 'Stock: low to high' },
  { value: 'stock_high', label: 'Stock: high to low' },
];

export function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const permissions = permissionsFor(role);
  const { isOnline } = useOffline();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProductsStackParamList>>();
  const listRef = useRef<FlatList>(null);
  const [filter, setFilter] = useState<ProductFilter>({ type: 'all' });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<ProductSort>('newest');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const archived = filter.type === 'archive';
  const {
    products,
    page,
    totalPages,
    totalCount,
    start,
    end,
    categories,
    lowStockCount,
    totalUnits,
    threshold,
    loading,
    error,
    refresh,
    goToPage,
  } = useProducts({
    archived,
    search: debouncedSearch,
    category: filter.type === 'category' ? filter.value : '',
    lowStockOnly: filter.type === 'low',
    sort,
  });

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [page]);

  function openSort() {
    Alert.alert(
      'Sort products',
      undefined,
      [
        ...SORT_OPTIONS.map(option => ({
          text: option.label + (sort === option.value ? ' ✓' : ''),
          onPress: () => setSort(option.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }

  const filtered =
    !!debouncedSearch || filter.type === 'category' || filter.type === 'low';

  const summary = archived
    ? `${totalCount} archived`
    : filtered
      ? `${totalCount} product${totalCount === 1 ? '' : 's'}`
      : `${totalCount} product${totalCount === 1 ? '' : 's'} · ${totalUnits} units in stock`;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-start justify-between px-5 pt-2">
        <View className="min-w-0 flex-1 pr-3">
          <Text className="text-[28px] font-bold tracking-tight text-text">
            Products
          </Text>
          <Text className="mt-1 text-[14px] text-text-muted">{summary}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sort products"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={openSort}
        >
          <ArrowUpDown color={colors.text} size={18} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View className="mx-5 mt-4 flex-row items-center rounded-full bg-surface px-4 py-3">
        <Search color={colors.textSubtle} size={18} strokeWidth={1.8} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products"
          placeholderTextColor={colors.textSubtle}
          className="ml-2.5 flex-1 text-[15px] text-text"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View className="mt-3">
        <ProductFilterChips
          filter={filter}
          categories={categories}
          lowStockCount={lowStockCount}
          onChange={next => {
            setFilter(next);
          }}
        />
      </View>

      {error ? (
        <Text className="mx-5 mt-3 text-[13px] text-danger">{error}</Text>
      ) : null}

      {loading && products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={products}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 88,
            gap: 8,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading && products.length > 0}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <Text className="text-[16px] font-semibold text-text">
                No products found
              </Text>
              <Text className="mt-2 text-center text-[14px] text-text-muted">
                {search.trim() || filter.type !== 'all'
                  ? 'Try a different search or filter.'
                  : 'Tap + to add your first product.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              threshold={threshold}
              onPress={() =>
                navigation.navigate('ProductDetail', { productId: item.id })
              }
            />
          )}
        />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={totalCount}
        start={start}
        end={end}
        onPageChange={goToPage}
        itemLabel="products"
      />

      {permissions.canEditProducts ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add product"
          className="absolute right-5 h-14 w-14 items-center justify-center rounded-[20px] bg-accent shadow-lg shadow-black/20 active:opacity-90"
          style={{ bottom: 78 }}
          onPress={() => {
            if (!isOnline) {
              alertNeedsConnection('Adding a product');
              return;
            }
            navigation.navigate('ProductForm');
          }}
        >
          <Plus color={colors.white} size={26} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}
