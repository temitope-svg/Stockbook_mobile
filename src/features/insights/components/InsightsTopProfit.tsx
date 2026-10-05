import { Pressable, Text, View } from 'react-native';
import { formatCompactNaira } from '../../../utils/money';
import type { InsightsProductRank } from '../hooks/useShopInsights';

type InsightsTopProfitProps = {
  items: InsightsProductRank[];
  onPressItem?: (id: string) => void;
};

export function InsightsTopProfit({
  items,
  onPressItem,
}: InsightsTopProfitProps) {
  const max = Math.max(...items.map(i => i.profit ?? 0), 1);

  return (
    <View>
      <Text className="mb-3 text-[16px] font-bold text-text">
        Top products by profit
      </Text>

      {items.length === 0 ? (
        <View className="rounded-[22px] bg-surface px-4 py-5">
          <Text className="text-[13px] text-text-muted">
            No product sales in this range yet.
          </Text>
        </View>
      ) : (
        <View className="rounded-[22px] bg-surface px-4 py-2">
          {items.map((item, index) => {
            const profit = item.profit ?? 0;
            const width = Math.max(8, Math.round((profit / max) * 100));
            return (
              <Pressable
                key={item.id}
                onPress={() => onPressItem?.(item.id)}
                className={
                  index < items.length - 1
                    ? 'border-b border-text/5 py-3.5 active:opacity-80'
                    : 'py-3.5 active:opacity-80'
                }
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={
                      index === 0
                        ? 'h-7 w-7 items-center justify-center rounded-full bg-primary-tint'
                        : 'h-7 w-7 items-center justify-center rounded-full bg-background'
                    }
                  >
                    <Text
                      className={
                        index === 0
                          ? 'text-[12px] font-bold text-primary'
                          : 'text-[12px] font-semibold text-text-muted'
                      }
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    className="min-w-0 flex-1 text-[15px] font-medium text-text"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-[14px] font-bold text-primary">
                    {formatCompactNaira(profit)}
                  </Text>
                </View>
                <View className="mt-2.5 h-2 overflow-hidden rounded-full bg-background">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
