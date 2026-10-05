import {
  AlertTriangle,
  CircleCheck,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { AttentionItem } from '../hooks/useAttentionItems';

type NeedsAttentionProps = {
  items: AttentionItem[];
  onItemPress?: (item: AttentionItem) => void;
};

export function NeedsAttention({ items, onItemPress }: NeedsAttentionProps) {
  return (
    <View className="mx-5">
      <Text className="mb-3 text-[16px] font-bold tracking-tight text-text">
        Needs attention
      </Text>

      <View className="overflow-hidden rounded-[24px] bg-surface">
        {items.length === 0 ? (
          <View className="items-center px-5 py-10">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-tint">
              <CircleCheck color={colors.primary} size={20} strokeWidth={1.8} />
            </View>
            <Text className="mt-3 text-[14px] font-semibold text-text">
              You're all clear
            </Text>
            <Text className="mt-1 text-center text-[13px] text-text-muted">
              Low stock and unpaid debts will appear here when they need you.
            </Text>
          </View>
        ) : (
          items.map((item, index) => {
            const isStock = item.kind === 'low_stock';
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                className={
                  index > 0
                    ? 'flex-row items-center gap-3 border-t border-text/5 px-4 py-3.5 active:bg-background/60'
                    : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-background/60'
                }
                onPress={() => onItemPress?.(item)}
              >
                <View
                  className={
                    isStock
                      ? 'h-11 w-11 items-center justify-center rounded-full bg-accent-tint'
                      : 'h-11 w-11 items-center justify-center rounded-full bg-danger-tint'
                  }
                >
                  {isStock ? (
                    <AlertTriangle
                      color={colors.accent}
                      size={18}
                      strokeWidth={2}
                    />
                  ) : (
                    <User color={colors.danger} size={18} strokeWidth={1.8} />
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[15px] font-semibold text-text"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className={
                      item.detailTone === 'danger'
                        ? 'mt-0.5 text-[12px] font-medium text-danger'
                        : 'mt-0.5 text-[12px] text-text-subtle'
                    }
                  >
                    {item.detail}
                  </Text>
                </View>
                <ChevronRight
                  color={colors.textSubtle}
                  size={18}
                  strokeWidth={2}
                />
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}
