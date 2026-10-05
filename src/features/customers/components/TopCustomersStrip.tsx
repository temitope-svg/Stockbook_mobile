import { Pressable, ScrollView, Text, View } from 'react-native';
import { formatCompactNaira } from '../../../utils/money';
import type { CustomerRankRow } from '../hooks/useCustomerRankings';
import { CustomerAvatar } from './CustomerAvatar';

type TopCustomersStripProps = {
  rows: CustomerRankRow[];
  onPress?: (id: string) => void;
};

export function TopCustomersStrip({ rows, onPress }: TopCustomersStripProps) {
  if (rows.length === 0) return null;

  return (
    <View className="mt-5">
      <View className="mb-3 flex-row items-end justify-between px-5">
        <Text className="text-[16px] font-bold text-text">Top this month</Text>
        <Text className="text-[13px] font-semibold text-primary">By spend</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {rows.map(row => (
          <Pressable
            key={row.id}
            accessibilityRole="button"
            onPress={() => onPress?.(row.id)}
            className="flex-row items-center gap-2 rounded-full bg-surface py-2 pl-2 pr-3.5 active:opacity-90"
          >
            <CustomerAvatar name={row.name} photoUrl={row.photoUrl} size="sm" />
            <Text className="text-[13px] font-semibold text-text" numberOfLines={1}>
              {row.name.split(' ')[0]} {formatCompactNaira(row.spend)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
