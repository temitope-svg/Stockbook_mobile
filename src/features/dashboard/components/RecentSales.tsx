import { Receipt, User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';
import type { RecentSaleRow } from '../hooks/useDashboardData';

type RecentSalesProps = {
  sales: RecentSaleRow[];
  onViewAll?: () => void;
  onSalePress?: (id: string) => void;
};

function formatSaleWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const time = date.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (date >= startToday) return time;
  if (date >= startYesterday) return `Yesterday · ${time}`;
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
  });
}

function initialsFrom(summary: string) {
  const words = summary
    .replace(/[×x].*$/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') {
    return (
      <View className="rounded-full bg-primary-tint px-2 py-0.5">
        <Text className="text-[11px] font-semibold text-primary">Paid</Text>
      </View>
    );
  }
  if (status === 'credit') {
    return (
      <View className="rounded-full bg-accent-tint px-2 py-0.5">
        <Text className="text-[11px] font-semibold text-accent">On credit</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full bg-accent-tint px-2 py-0.5">
      <Text className="text-[11px] font-semibold text-accent">Partial</Text>
    </View>
  );
}

function Avatar({ summary }: { summary: string }) {
  const initials = initialsFrom(summary);
  const walkIn = /walk-?in/i.test(summary);

  if (walkIn) {
    return (
      <View className="h-11 w-11 items-center justify-center rounded-full bg-background">
        <User color={colors.textSubtle} size={18} strokeWidth={1.8} />
      </View>
    );
  }

  return (
    <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-tint">
      <Text className="text-[13px] font-bold text-primary">{initials}</Text>
    </View>
  );
}

export function RecentSales({
  sales,
  onViewAll,
  onSalePress,
}: RecentSalesProps) {
  return (
    <View className="mx-5">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-[16px] font-bold tracking-tight text-text">
          Recent sales
        </Text>
        {sales.length > 0 ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text className="text-[14px] font-semibold text-primary">
              View all
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="overflow-hidden rounded-[24px] bg-surface">
        {sales.length === 0 ? (
          <View className="items-center px-5 py-10">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-tint">
              <Receipt color={colors.primary} size={20} strokeWidth={1.8} />
            </View>
            <Text className="mt-3 text-[14px] font-semibold text-text">
              No sales yet
            </Text>
            <Text className="mt-1 text-center text-[13px] text-text-muted">
              Record your first sale and it will show up here.
            </Text>
          </View>
        ) : (
          sales.slice(0, 5).map((sale, index) => (
            <Pressable
              key={sale.id}
              accessibilityRole="button"
              className={
                index > 0
                  ? 'flex-row items-center gap-3 border-t border-text/5 px-4 py-3.5 active:bg-background/60'
                  : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-background/60'
              }
              onPress={() => onSalePress?.(sale.id)}
            >
              <Avatar summary={sale.summary} />
              <View className="min-w-0 flex-1">
                <Text
                  className="text-[15px] font-semibold text-text"
                  numberOfLines={1}
                >
                  {sale.summary}
                </Text>
                <Text className="mt-0.5 text-[12px] text-text-subtle">
                  {formatSaleWhen(sale.created_at)}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Text className="text-[15px] font-bold text-text">
                  {formatNaira(sale.total_amount)}
                </Text>
                <StatusBadge status={sale.payment_status} />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
