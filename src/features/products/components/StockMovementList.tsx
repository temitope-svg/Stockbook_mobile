import { FileText } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import type { StockMovementView } from '../hooks/useProductDetail';
import {
  formatMovementWhen,
  movementTitle,
} from '../utils/productPerformance';

type StockMovementListProps = {
  movements: StockMovementView[];
};

export function StockMovementList({ movements }: StockMovementListProps) {
  if (movements.length === 0) {
    return (
      <View className="items-center rounded-2xl bg-surface px-4 py-10">
        <Text className="text-[14px] font-medium text-text-muted">
          No movement yet
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-surface">
      {movements.slice(0, 12).map((move, index) => {
        const inbound = move.kind === 'in';
        return (
          <View
            key={move.id}
            className={
              index === 0
                ? 'flex-row items-center gap-3 px-4 py-3.5'
                : 'flex-row items-center gap-3 border-t border-text/5 px-4 py-3.5'
            }
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-background">
              <FileText
                color={colors.textSubtle}
                size={18}
                strokeWidth={1.8}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className="text-[14px] font-semibold text-text"
                numberOfLines={1}
              >
                {movementTitle(move)}
              </Text>
              <Text className="mt-0.5 text-[12px] text-text-subtle">
                {formatMovementWhen(move.created_at)}
              </Text>
            </View>
            <Text
              className={
                inbound
                  ? 'text-[15px] font-bold text-primary'
                  : 'text-[15px] font-bold text-text'
              }
            >
              {inbound ? '+' : '-'}
              {move.quantity}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
