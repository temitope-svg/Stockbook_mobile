import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { permissionsFor } from '../../auth/permissions';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import {
  addDays,
  formatShortDateRange,
  parseDateInput,
  toDateInputValue,
  todayValue,
} from '../../utils/dates';
import { useShopInsights } from './hooks/useShopInsights';
import type { MoreStackParamList } from '../more/MoreStack';
import { InsightsPeriodChips, type InsightsPeriod } from './components/InsightsPeriodChips';
import { InsightsSlowMovers } from './components/InsightsSlowMovers';
import {
  InsightsRevenueHero,
  InsightsStatRow,
} from './components/InsightsStats';
import { InsightsTopProfit } from './components/InsightsTopProfit';
import { InsightsTrendChart } from './components/InsightsTrendChart';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'Insights'>;

function rangeForPreset(
  preset: Exclude<InsightsPeriod, 'custom'>,
): { from: string; to: string } {
  const today = parseDateInput(todayValue());
  if (preset === 'week') {
    return {
      from: toDateInputValue(addDays(today, -6)),
      to: toDateInputValue(today),
    };
  }
  if (preset === 'month') {
    return {
      from: toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toDateInputValue(today),
    };
  }
  return {
    from: toDateInputValue(new Date(today.getFullYear(), 0, 1)),
    to: toDateInputValue(today),
  };
}

function periodTipLabel(preset: InsightsPeriod): string {
  if (preset === 'week') return 'this week';
  if (preset === 'year') return 'this year';
  if (preset === 'custom') return 'in this period';
  return 'this month';
}

function previousCompareLabel(
  preset: InsightsPeriod,
  dateFrom: string,
): string | null {
  const from = parseDateInput(dateFrom);
  if (preset === 'month') {
    const prev = new Date(from.getFullYear(), from.getMonth() - 1, 1);
    return prev.toLocaleDateString('en-NG', { month: 'short' });
  }
  if (preset === 'week') return 'prior week';
  if (preset === 'year') return String(from.getFullYear() - 1);
  return 'prior period';
}

export function InsightsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const canView = permissionsFor(role).canViewCost;

  const initial = rangeForPreset('month');
  const [preset, setPreset] = useState<InsightsPeriod>('month');
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);

  const {
    data,
    weekly,
    loading,
    refreshing,
    ready,
    error,
    revenueChangePct,
    refresh,
  } = useShopInsights(dateFrom, dateTo);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  useEffect(() => {
    if (!canView) {
      goBackInStack(navigation, 'MoreHome');
    }
  }, [canView, navigation]);

  const rangeLabel = useMemo(
    () => formatShortDateRange(dateFrom, dateTo),
    [dateFrom, dateTo],
  );

  function applyPreset(next: InsightsPeriod) {
    setPreset(next);
    if (next === 'custom') return;
    const range = rangeForPreset(next);
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  function openProduct(productId: string) {
    const parent = navigation.getParent();
    if (!parent) return;
    pushInTab(parent, 'ProductsTab', 'ProductsList', 'ProductDetail', {
      productId,
    });
  }

  const errorMessage =
    error == null
      ? null
      : error.includes('get_shop_insights') ||
          error.includes('Could not find the function')
        ? 'Run stockbook-insights-restock-cost-migration.sql in Supabase, then try again.'
        : error;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'MoreHome')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <Text className="text-[20px] font-bold text-text">Insights</Text>
      </View>

      {!ready || (loading && !refreshing && data.revenue === 0 && data.salesCount === 0 && data.chart.length === 0) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 32 + Math.max(insets.bottom, 8),
          }}
        >
          <InsightsPeriodChips
            value={preset}
            onChange={applyPreset}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onCustomRange={(from, to) => {
              setPreset('custom');
              setDateFrom(from);
              setDateTo(to);
            }}
          />

          {errorMessage ? (
            <View className="mt-4 rounded-2xl bg-danger-tint px-4 py-3">
              <Text className="text-[13px] font-medium text-danger">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View className="mt-4">
            <InsightsRevenueHero
              revenue={data.revenue}
              rangeLabel={rangeLabel}
              changePct={revenueChangePct}
              changeLabel={previousCompareLabel(preset, dateFrom)}
            />
          </View>

          <View className="mt-3">
            <InsightsStatRow
              profit={data.profit}
              restockSpend={data.restockSpend}
              salesCount={data.salesCount}
            />
          </View>

          <Text className="mt-2 px-1 text-[11px] leading-4 text-text-subtle">
            Profit uses current cost prices (estimate). Restock spend only
            counts restocks recorded with a buying price.
          </Text>

          <View className="mt-4">
            <InsightsTrendChart buckets={data.chart} weekly={weekly} />
          </View>

          <View className="mt-5">
            <InsightsTopProfit
              items={data.topProfit}
              onPressItem={openProduct}
            />
          </View>

          <View className="mt-5">
            <InsightsSlowMovers
              items={data.slowMovers}
              periodLabel={periodTipLabel(preset)}
              onPressItem={openProduct}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
