import { AlertTriangle, ChevronRight, HandCoins } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';

type SnapshotCardsProps = {
  totalOwed: number;
  overdueCount: number;
  lowStockCount: number;
  productsInStock: number;
  onOwedPress?: () => void;
  onLowStockPress?: () => void;
};

export function SnapshotCards({
  totalOwed,
  overdueCount,
  lowStockCount,
  productsInStock,
  onOwedPress,
  onLowStockPress,
}: SnapshotCardsProps) {
  return (
    <View className="mx-5 flex-row gap-3">
      <Pressable
        accessibilityRole="button"
        className="flex-1 rounded-[22px] bg-surface px-4 py-4 active:opacity-90"
        onPress={onOwedPress}
      >
        <View className="flex-row items-start justify-between">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-tint">
            <HandCoins color={colors.accent} size={18} strokeWidth={1.8} />
          </View>
          <ChevronRight color={colors.textSubtle} size={18} strokeWidth={2} />
        </View>
        <Text className="mt-3 text-[13px] text-text-muted">Owed to you</Text>
        <Text className="mt-1 text-[20px] font-bold tracking-tight text-text">
          {formatNaira(totalOwed)}
        </Text>
        {overdueCount > 0 ? (
          <Text className="mt-1 text-[13px] font-medium text-danger">
            {overdueCount} overdue
          </Text>
        ) : (
          <Text className="mt-1 text-[13px] text-text-subtle">All clear</Text>
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        className="flex-1 rounded-[22px] bg-surface px-4 py-4 active:opacity-90"
        onPress={onLowStockPress}
      >
        <View className="flex-row items-start justify-between">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-tint">
            <AlertTriangle color={colors.accent} size={18} strokeWidth={2} />
          </View>
          <ChevronRight color={colors.textSubtle} size={18} strokeWidth={2} />
        </View>
        <Text className="mt-3 text-[13px] text-text-muted">Low stock</Text>
        <Text className="mt-1 text-[20px] font-bold tracking-tight text-text">
          {lowStockCount} item{lowStockCount === 1 ? '' : 's'}
        </Text>
        <Text className="mt-1 text-[13px] text-text-subtle">
          of {productsInStock} products
        </Text>
      </Pressable>
    </View>
  );
}
