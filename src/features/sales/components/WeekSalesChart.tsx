import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { DayBucket } from '../hooks/useSalesInsights';

type WeekSalesChartProps = {
  data: DayBucket[];
};

export function WeekSalesChart({ data }: WeekSalesChartProps) {
  const max = Math.max(...data.map(d => d.total), 1);
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  })();

  if (data.length === 0) {
    return (
      <View className="mt-4 h-24 items-center justify-center">
        <Text className="text-[13px] text-text-subtle">No sales this week</Text>
      </View>
    );
  }

  return (
    <View className="mt-4 flex-row items-end justify-between gap-1">
      {data.map(day => {
        const height = Math.max(8, Math.round((day.total / max) * 72));
        const active = day.key === todayKey;
        return (
          <View key={day.key} className="flex-1 items-center">
            <View
              className="w-full max-w-[30px] rounded-t-lg"
              style={{
                height,
                backgroundColor: active ? colors.primary : '#c5dbc8',
              }}
            />
            <Text
              className={
                active
                  ? 'mt-2 text-[11px] font-semibold text-primary'
                  : 'mt-2 text-[11px] font-medium text-text-subtle'
              }
            >
              {day.label.slice(0, 3)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
