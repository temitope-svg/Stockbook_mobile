import { Gem, Lightbulb, Package, Shirt } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';
import type { InsightsProductRank } from '../hooks/useShopInsights';

const ICON_STYLES = [
  { bg: 'bg-accent-tint', color: colors.accent, Icon: Gem },
  { bg: 'bg-primary-tint', color: colors.primary, Icon: Shirt },
  { bg: 'bg-danger-tint', color: colors.danger, Icon: Package },
  { bg: 'bg-teal-tint', color: colors.teal, Icon: Package },
  { bg: 'bg-background', color: colors.textMuted, Icon: Package },
] as const;

type InsightsSlowMoversProps = {
  items: InsightsProductRank[];
  periodLabel: string;
  onPressItem?: (id: string) => void;
};

export function InsightsSlowMovers({
  items,
  periodLabel,
  onPressItem,
}: InsightsSlowMoversProps) {
  const tipItem = items.find(item => item.soldQty === 0) ?? items[0];
  const tipStockValue =
    tipItem != null
      ? (tipItem.quantity ?? 0) * (tipItem.costPrice ?? 0)
      : 0;

  return (
    <View>
      <Text className="mb-3 text-[16px] font-bold text-text">Slow movers</Text>

      {tipItem && tipItem.soldQty === 0 && tipStockValue > 0 ? (
        <View className="mb-3 flex-row items-start gap-2.5 rounded-[18px] bg-accent-tint px-3.5 py-3">
          <Lightbulb color={colors.accent} size={18} strokeWidth={1.9} />
          <Text className="min-w-0 flex-1 text-[13px] leading-5 text-accent">
            {tipItem.name} hasn't sold {periodLabel}.{' '}
            {formatNaira(tipStockValue)} of stock is sitting on the shelf.
          </Text>
        </View>
      ) : null}

      {items.length === 0 ? (
        <View className="rounded-[22px] bg-surface px-4 py-5">
          <Text className="text-[13px] text-text-muted">
            No active products to rank.
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-[22px] bg-surface">
          {items.map((item, index) => {
            const style = ICON_STYLES[index % ICON_STYLES.length];
            const Icon = style.Icon;
            const sold = item.soldQty;
            const badge =
              sold === 0
                ? {
                    wrap: 'bg-danger-tint',
                    text: 'text-danger',
                    label: '0 sold',
                  }
                : sold === 1
                  ? {
                      wrap: 'bg-accent-tint',
                      text: 'text-accent',
                      label: '1 sold',
                    }
                  : {
                      wrap: 'bg-background',
                      text: 'text-text-muted',
                      label: `${sold} sold`,
                    };

            return (
              <Pressable
                key={item.id}
                onPress={() => onPressItem?.(item.id)}
                className={
                  index < items.length - 1
                    ? 'flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:opacity-80'
                    : 'flex-row items-center gap-3 px-4 py-3.5 active:opacity-80'
                }
              >
                <View
                  className={`h-10 w-10 items-center justify-center rounded-xl ${style.bg}`}
                >
                  <Icon color={style.color} size={18} strokeWidth={1.9} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[15px] font-semibold text-text"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-text-subtle">
                    {item.quantity ?? 0} in stock
                  </Text>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${badge.wrap}`}>
                  <Text className={`text-[12px] font-semibold ${badge.text}`}>
                    {badge.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
