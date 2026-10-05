import { Store, Truck } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';

type SuppliersSummaryCardsProps = {
  monthSpend: number;
  supplierCount: number;
  monthLabel: string;
};

export function SuppliersSummaryCards({
  monthSpend,
  supplierCount,
  monthLabel,
}: SuppliersSummaryCardsProps) {
  return (
    <View className="flex-row gap-2.5">
      <View className="flex-1 rounded-[20px] bg-surface px-3.5 py-3.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-accent-tint">
          <Truck color={colors.accent} size={18} strokeWidth={1.9} />
        </View>
        <Text className="mt-3 text-[12px] font-medium text-text-muted">
          Restock spend · {monthLabel}
        </Text>
        <Text className="mt-1 text-[20px] font-bold tracking-tight text-text">
          {formatNaira(monthSpend)}
        </Text>
      </View>
      <View className="flex-1 rounded-[20px] bg-surface px-3.5 py-3.5">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-tint">
          <Store color={colors.primary} size={18} strokeWidth={1.9} />
        </View>
        <Text className="mt-3 text-[12px] font-medium text-text-muted">
          Suppliers
        </Text>
        <Text className="mt-1 text-[20px] font-bold tracking-tight text-text">
          {supplierCount.toLocaleString('en-NG')}
        </Text>
      </View>
    </View>
  );
}
