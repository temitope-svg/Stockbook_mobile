import { Clock, Wallet } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';

type CustomersSummaryCardsProps = {
  totalOwed: number;
  overdueCount: number;
};

export function CustomersSummaryCards({
  totalOwed,
  overdueCount,
}: CustomersSummaryCardsProps) {
  return (
    <View className="mx-5 flex-row gap-3">
      <View className="min-w-0 flex-[1.4] rounded-2xl bg-accent-tint/70 px-4 py-4">
        <View className="mb-3 h-8 w-8 items-center justify-center rounded-xl bg-accent/15">
          <Wallet color={colors.accent} size={16} strokeWidth={1.8} />
        </View>
        <Text className="text-[12px] font-medium text-text-muted">
          Owed to you
        </Text>
        <Text className="mt-1 text-[22px] font-bold tracking-tight text-text">
          {formatNaira(totalOwed)}
        </Text>
      </View>

      <View className="flex-1 rounded-2xl bg-surface px-4 py-4">
        <View className="mb-3 h-8 w-8 items-center justify-center rounded-full bg-danger-tint">
          <Clock color={colors.danger} size={14} strokeWidth={2} />
        </View>
        <Text className="text-[12px] font-medium text-text-muted">Overdue</Text>
        <Text className="mt-1 text-[22px] font-bold tracking-tight text-danger">
          {overdueCount}
        </Text>
      </View>
    </View>
  );
}
