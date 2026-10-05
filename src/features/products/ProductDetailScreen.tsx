import {
  ArrowLeft,
  BarChart3,
  Ellipsis,
  Pencil,
  Plus,
  SlidersHorizontal,
  Truck,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { permissionsFor } from '../../auth/permissions';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import {
  enabledCustomFields,
  normalizeCustomProductFields,
} from '../../utils/customProductFields';
import { formatCompactNaira, formatNaira } from '../../utils/money';
import { isLowStock, productSubtitle } from '../../utils/product';
import { productIconMeta } from '../../utils/productIcon';
import {
  AdjustStockSheet,
  adjustReasonLabel,
  type AdjustReason,
} from './components/AdjustStockSheet';
import { RestockSheet, type RestockPayload } from './components/RestockSheet';
import { SalesPerformanceChart } from './components/SalesPerformanceChart';
import { StockMovementList } from './components/StockMovementList';
import { useProductDetail } from './hooks/useProductDetail';
import {
  filterSalesForChart,
  salesChartPoints,
  summarizePeriodSales,
  type ChartPeriod,
} from './utils/productPerformance';
import type { ProductsStackParamList } from './ProductsStack';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductDetail'>;

const PERIODS: ChartPeriod[] = ['7d', '30d', '90d'];

export function ProductDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, role, shopId } = useAuth();
  const permissions = permissionsFor(role);
  const threshold = profile?.low_stock_threshold ?? 5;
  const { data, loading, error, refresh } = useProductDetail(
    route.params.productId,
  );

  const [period, setPeriod] = useState<ChartPeriod>('30d');
  const [restockOpen, setRestockOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  const periodSales = useMemo(() => {
    if (!data) return [];
    return filterSalesForChart(data.sales, period);
  }, [data, period]);

  const periodStats = useMemo(() => {
    if (!data) return { soldQty: 0, revenue: 0, profit: 0 };
    return summarizePeriodSales(periodSales, Number(data.product.cost_price));
  }, [data, periodSales]);

  const chartPoints = useMemo(
    () => salesChartPoints(periodSales, period),
    [periodSales, period],
  );

  async function onRestock(payload: RestockPayload) {
    if (!data) return;
    setRestocking(true);
    const { error: rpcError } = await supabase.rpc('restock_product', {
      p_product_id: data.product.id,
      p_quantity: payload.quantity,
      p_unit_cost: payload.unitCost,
      p_selling_price: payload.sellingPrice,
      p_note: payload.note || null,
      p_supplier_id: payload.supplierId,
    });
    setRestocking(false);

    if (rpcError) {
      Alert.alert("Couldn't restock", rpcError.message);
      return;
    }

    setRestockOpen(false);
    await refresh();
    Alert.alert(
      'Stock added',
      `${payload.quantity} more ${data.product.name} now in the shop.`,
    );
  }

  async function onAdjust(
    nextQuantity: number,
    reason: AdjustReason,
    note: string,
  ) {
    if (!data) return;
    const why = adjustReasonLabel(reason);
    const movementNote = note ? `${why} — ${note}` : why;

    setAdjusting(true);
    const { error: rpcError } = await supabase.rpc('adjust_product_stock', {
      p_product_id: data.product.id,
      p_quantity: nextQuantity,
      p_note: movementNote,
    });
    setAdjusting(false);

    if (rpcError) {
      Alert.alert("Couldn't adjust", rpcError.message);
      return;
    }

    setAdjustOpen(false);
    await refresh();
    Alert.alert('Stock adjusted', `Now showing ${nextQuantity} in stock.`);
  }

  async function setProductActive(isActive: boolean) {
    if (!data || !shopId) return;
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', data.product.id)
      .eq('user_id', shopId);
    if (updateError) {
      Alert.alert("Couldn't update", updateError.message);
      return;
    }
    if (!isActive) {
      Alert.alert('Archived', `${data.product.name} was moved to archive.`);
      goBackInStack(navigation, 'ProductsList');
      return;
    }
    await refresh();
    Alert.alert('Restored', `${data.product.name} is active again.`);
  }

  function onMoreActions() {
    if (!data || !permissions.canEditProducts) return;
    const active = data.product.is_active;
    Alert.alert(
      data.product.name,
      active ? 'Archive hides this product from sales.' : 'Restore to sell again.',
      [
        active
          ? {
              text: 'Archive product',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Archive product?',
                  `${data.product.name} won’t appear in new sales.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Archive',
                      style: 'destructive',
                      onPress: () => void setProductActive(false),
                    },
                  ],
                );
              },
            }
          : {
              text: 'Restore product',
              onPress: () => void setProductActive(true),
            },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }

  if (loading && !data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-[16px] font-semibold text-text">
          Product not found
        </Text>
        {error ? (
          <Text className="mt-2 text-center text-[13px] text-danger">{error}</Text>
        ) : null}
        <Pressable
          className="mt-4"
          onPress={() => goBackInStack(navigation, 'ProductsList')}
        >
          <Text className="text-[14px] font-semibold text-primary">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { product } = data;
  const low = isLowStock(
    product.quantity,
    product.low_stock_threshold,
    threshold,
  );
  const { Icon, iconColor, bgClass } = productIconMeta(
    product.name,
    product.category,
  );
  const subtitle = productSubtitle(product);
  const customFieldRows = enabledCustomFields(
    normalizeCustomProductFields(profile?.custom_product_fields),
  )
    .map(field => {
      const value = product.custom_fields?.[field.id]?.trim();
      if (!value) return null;
      return { id: field.id, label: field.label, value };
    })
    .filter((row): row is { id: string; label: string; value: string } =>
      Boolean(row),
    );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'ProductsList')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        {permissions.canEditProducts ? (
          <View className="flex-row gap-2">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={() =>
                navigation.navigate('ProductForm', { productId: product.id })
              }
            >
              <Pencil color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onMoreActions}
            >
              <Ellipsis color={colors.text} size={20} strokeWidth={1.8} />
            </Pressable>
          </View>
        ) : (
          <View className="h-11 w-11" />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 28 + Math.max(insets.bottom, 8),
        }}
        showsVerticalScrollIndicator={false}
      >
        {product.image_url ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View full image"
            className="active:opacity-90"
            onPress={() => setImageOpen(true)}
          >
            <Image
              source={{ uri: product.image_url }}
              className="h-48 w-full rounded-[24px] bg-background"
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View
            className={`h-48 w-full items-center justify-center rounded-[24px] ${bgClass}`}
          >
            <Icon color={iconColor} size={56} strokeWidth={1.5} />
          </View>
        )}

        <View className="mt-4 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[24px] font-bold text-text">{product.name}</Text>
            <Text className="mt-1 text-[14px] text-text-muted">{subtitle}</Text>
            {low ? (
              <View className="mt-2 self-start rounded-full bg-accent-tint px-2.5 py-1">
                <Text className="text-[11px] font-semibold text-accent">
                  Low stock
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[22px] font-bold text-text">
            {formatNaira(Number(product.selling_price))}
          </Text>
        </View>

        {customFieldRows.length > 0 ? (
          <View className="mt-3 rounded-2xl bg-surface px-4 py-3.5">
            {customFieldRows.map((row, index) => (
              <View
                key={row.id}
                className={
                  index < customFieldRows.length - 1
                    ? 'mb-2.5 flex-row items-center justify-between gap-3 border-b border-text/5 pb-2.5'
                    : 'flex-row items-center justify-between gap-3'
                }
              >
                <Text className="text-[13px] text-text-muted">{row.label}</Text>
                <Text
                  className="min-w-0 flex-1 text-right text-[14px] font-semibold text-text"
                  numberOfLines={2}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
            <Text className="text-[11px] text-text-subtle">In stock</Text>
            <Text className="mt-1 text-[22px] font-bold text-text">
              {product.quantity}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
            <Text className="text-[11px] text-text-subtle">Sold · {period}</Text>
            <Text className="mt-1 text-[22px] font-bold text-text">
              {periodStats.soldQty}
            </Text>
          </View>
          {permissions.canViewCost ? (
            <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-text-subtle">Est. profit</Text>
                <BarChart3 color={colors.primary} size={14} strokeWidth={1.8} />
              </View>
              <Text className="mt-1 text-[18px] font-bold text-primary">
                {formatCompactNaira(periodStats.profit)}
              </Text>
            </View>
          ) : (
            <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
              <Text className="text-[11px] text-text-subtle">Revenue · {period}</Text>
              <Text className="mt-1 text-[18px] font-bold text-text">
                {formatCompactNaira(periodStats.revenue)}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-90"
          onPress={() => {
            const parent = navigation.getParent();
            if (!parent) return;
            pushInTab(parent, 'SalesTab', 'SalesList', 'RecordSale', {
              productId: product.id,
            });
          }}
        >
          <Plus color={colors.white} size={18} strokeWidth={2.2} />
          <Text className="text-[15px] font-semibold text-white">
            Record sale
          </Text>
        </Pressable>

        {permissions.canEditProducts ? (
          <View className="mt-2.5 flex-row gap-2.5">
            <Pressable
              className="h-12 flex-[1.4] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
              onPress={() => setRestockOpen(true)}
            >
              <Truck color={colors.white} size={18} strokeWidth={1.8} />
              <Text className="text-[15px] font-semibold text-white">
                Restock
              </Text>
            </Pressable>
            <Pressable
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-text/10 bg-surface active:opacity-90"
              onPress={() => setAdjustOpen(true)}
            >
              <SlidersHorizontal
                color={colors.primary}
                size={18}
                strokeWidth={1.8}
              />
              <Text className="text-[15px] font-semibold text-text">Adjust</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mt-5 rounded-2xl bg-surface px-4 py-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[16px] font-bold text-text">
              Sales performance
            </Text>
            <View className="flex-row rounded-full bg-background p-1">
              {PERIODS.map(item => {
                const active = period === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setPeriod(item)}
                    className={
                      active
                        ? 'rounded-full bg-primary px-2.5 py-1'
                        : 'rounded-full px-2.5 py-1'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'text-[11px] font-semibold text-white'
                          : 'text-[11px] font-medium text-text-muted'
                      }
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <SalesPerformanceChart points={chartPoints} />
        </View>

        <Text className="mb-3 mt-5 text-[16px] font-bold text-text">
          Stock movement
        </Text>
        <StockMovementList movements={data.movements} />
      </ScrollView>

      <RestockSheet
        open={restockOpen}
        productName={product.name}
        currentQty={product.quantity}
        costPrice={Number(product.cost_price)}
        sellingPrice={Number(product.selling_price)}
        saving={restocking}
        onClose={() => setRestockOpen(false)}
        onSave={onRestock}
      />

      <AdjustStockSheet
        open={adjustOpen}
        currentQuantity={product.quantity}
        saving={adjusting}
        onClose={() => setAdjustOpen(false)}
        onSave={onAdjust}
      />

      <Modal
        visible={imageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setImageOpen(false)}
      >
        <StatusBar barStyle="light-content" />
        <View className="flex-1 bg-black">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close image"
            className="absolute z-10 h-11 w-11 items-center justify-center rounded-full bg-white/15 active:opacity-80"
            style={{ top: Math.max(insets.top, 12), right: 16 }}
            onPress={() => setImageOpen(false)}
          >
            <X color={colors.white} size={20} strokeWidth={2} />
          </Pressable>
          <Pressable
            className="flex-1 items-center justify-center px-2"
            onPress={() => setImageOpen(false)}
          >
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                className="h-full w-full"
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
