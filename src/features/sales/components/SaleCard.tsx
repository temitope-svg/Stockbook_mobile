import { User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';
import {
  customerInitials,
  formatSaleTime,
  paymentStatusLabel,
} from '../../../utils/sales';
import type { SalesListRow } from '../hooks/useSalesList';

type SaleCardProps = {
  sale: SalesListRow;
  onPress?: () => void;
};

function StatusBadge({ status }: { status: SalesListRow['payment_status'] }) {
  if (status === 'paid') {
    return (
      <View className="rounded-full bg-primary-tint px-2.5 py-1">
        <Text className="text-[11px] font-semibold text-primary">
          {paymentStatusLabel(status)}
        </Text>
      </View>
    );
  }
  if (status === 'credit') {
    return (
      <View className="rounded-full bg-accent-tint px-2.5 py-1">
        <Text className="text-[11px] font-semibold text-accent">
          {paymentStatusLabel(status)}
        </Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-danger-tint px-2.5 py-1">
      <Text className="text-[11px] font-semibold text-danger">
        {paymentStatusLabel(status)}
      </Text>
    </View>
  );
}

function Avatar({ name }: { name: string }) {
  const walkIn = /walk-?in/i.test(name);
  if (walkIn) {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-full bg-background">
        <User color={colors.textSubtle} size={20} strokeWidth={1.8} />
      </View>
    );
  }

  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-tint">
      <Text className="text-[13px] font-bold text-primary">
        {customerInitials(name)}
      </Text>
    </View>
  );
}

export function SaleCard({ sale, onPress }: SaleCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row gap-3 rounded-2xl bg-surface px-3.5 py-3.5 active:opacity-90"
      onPress={onPress}
    >
      <Avatar name={sale.customerName} />

      <View className="min-w-0 flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <Text
            className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-text"
            numberOfLines={1}
          >
            {sale.summary}
          </Text>
          <Text className="text-[15px] font-bold tabular-nums text-text">
            {formatNaira(sale.total_amount)}
          </Text>
        </View>

        <View className="mt-1 flex-row items-center justify-between gap-3">
          <Text
            className="min-w-0 flex-1 text-[13px] text-text-muted"
            numberOfLines={1}
          >
            {formatSaleTime(sale.created_at)} · {sale.customerName}
          </Text>
          {sale.pendingFailed ? (
            <View className="rounded-full bg-danger-tint px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-danger">
                Sync failed
              </Text>
            </View>
          ) : sale.pending ? (
            <View className="rounded-full bg-accent-tint px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-accent">
                Pending sync
              </Text>
            </View>
          ) : (
            <StatusBadge status={sale.payment_status} />
          )}
        </View>
      </View>
    </Pressable>
  );
}
