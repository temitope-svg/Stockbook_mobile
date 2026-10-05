import { TrendingUp } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';
import type { SalesInsights } from '../hooks/useSalesInsights';
import { WeekSalesChart } from './WeekSalesChart';

type WeekSummaryCardProps = {
  data: SalesInsights | null;
};

export function WeekSummaryCard({ data }: WeekSummaryCardProps) {
  const delta = data?.weekDelta ?? 0;
  const positive = delta >= 0;

  return (
    <View className="mx-5 rounded-[24px] bg-surface px-4 py-4">
      <View className="flex-row items-start justify-between">
        <Text className="text-[13px] font-medium text-text-muted">This week</Text>
        <View className="flex-row items-center gap-1 rounded-full bg-primary-tint px-2.5 py-1">
          <TrendingUp
            color={colors.primary}
            size={12}
            strokeWidth={2.4}
            style={{ transform: [{ rotate: positive ? '0deg' : '180deg' }] }}
          />
          <Text className="text-[12px] font-semibold text-primary">
            {positive ? '+' : ''}
            {delta}%
          </Text>
        </View>
      </View>

      <Text className="mt-2 text-[28px] font-bold tracking-tight text-text">
        {formatNaira(data?.weekTotal ?? 0)}
      </Text>

      <WeekSalesChart data={data?.chart7 ?? []} />
    </View>
  );
}
