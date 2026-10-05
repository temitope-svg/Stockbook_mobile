import { Check, Clock } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatRelativeVisit } from '../../../utils/customer';
import { formatNaira } from '../../../utils/money';
import type { CustomerLedgerRow } from '../hooks/useCustomerLedger';
import { CustomerAvatar } from './CustomerAvatar';

type CustomerCardProps = {
  customer: CustomerLedgerRow;
  onPress?: () => void;
};

function statusLine(customer: CustomerLedgerRow): {
  text: string;
  danger: boolean;
} | null {
  if (customer.hasDebt && customer.debtDays !== null) {
    const days = customer.debtDays;
    const dayText =
      days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`;
    if (customer.isOverdue) {
      return { text: `${dayText} overdue`, danger: true };
    }
    return { text: dayText, danger: false };
  }
  const visit = formatRelativeVisit(customer.lastPurchaseAt);
  return visit ? { text: visit, danger: false } : null;
}

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  const status = statusLine(customer);
  const overdue = customer.isOverdue;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        overdue
          ? 'flex-row items-center gap-3 rounded-2xl bg-danger-tint/70 px-3.5 py-3.5 active:opacity-90'
          : 'flex-row items-center gap-3 rounded-2xl bg-surface px-3.5 py-3.5 active:opacity-90'
      }
    >
      <CustomerAvatar
        name={customer.name}
        photoUrl={customer.photo_url}
        overdue={overdue}
      />

      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-text" numberOfLines={1}>
          {customer.name}
        </Text>
        {status ? (
          <View className="mt-1 flex-row items-center gap-1">
            {customer.hasDebt ? (
              <Clock
                color={status.danger ? colors.danger : colors.textSubtle}
                size={12}
                strokeWidth={2}
              />
            ) : null}
            <Text
              className={
                status.danger
                  ? 'text-[12px] font-medium text-danger'
                  : 'text-[12px] text-text-subtle'
              }
              numberOfLines={1}
            >
              {status.text}
            </Text>
          </View>
        ) : null}
      </View>

      {customer.hasDebt ? (
        <Text
          className={
            overdue
              ? 'text-[15px] font-bold text-danger'
              : 'text-[15px] font-bold text-text'
          }
        >
          {formatNaira(customer.amountOwed)}
        </Text>
      ) : (
        <View className="flex-row items-center gap-1 rounded-full bg-primary-tint px-2.5 py-1">
          <Check color={colors.primary} size={12} strokeWidth={2.6} />
          <Text className="text-[11px] font-semibold text-primary">Paid up</Text>
        </View>
      )}
    </Pressable>
  );
}
