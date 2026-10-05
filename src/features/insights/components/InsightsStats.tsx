import { Text, View } from 'react-native';
import { formatCompactNaira, formatNaira } from '../../../utils/money';

type InsightsStatRowProps = {
  profit: number;
  restockSpend: number;
  salesCount: number;
};

export function InsightsStatRow({
  profit,
  restockSpend,
  salesCount,
}: InsightsStatRowProps) {
  return (
    <View className="flex-row gap-2.5">
      <StatCard
        label="Est. profit"
        value={formatCompactNaira(profit)}
        valueClassName="text-primary"
      />
      <StatCard
        label="Restock"
        value={formatCompactNaira(restockSpend)}
        valueClassName="text-accent"
      />
      <StatCard
        label="Sales"
        value={salesCount.toLocaleString('en-NG')}
        valueClassName="text-text"
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <View className="flex-1 rounded-[18px] bg-surface px-3 py-3.5">
      <Text className="text-[12px] font-medium text-text-muted">{label}</Text>
      <Text className={`mt-1.5 text-[17px] font-bold tracking-tight ${valueClassName}`}>
        {value}
      </Text>
    </View>
  );
}

type InsightsRevenueHeroProps = {
  revenue: number;
  rangeLabel: string;
  changePct: number | null;
  changeLabel?: string | null;
};

export function InsightsRevenueHero({
  revenue,
  rangeLabel,
  changePct,
  changeLabel,
}: InsightsRevenueHeroProps) {
  const showChange = changePct != null && Number.isFinite(changePct);
  const up = (changePct ?? 0) >= 0;

  return (
    <View className="overflow-hidden rounded-[22px] bg-primary px-5 py-5">
      <View className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <View className="absolute -bottom-12 -right-4 h-28 w-28 rounded-full bg-black/10" />

      <View className="flex-row items-start justify-between gap-3">
        <Text className="text-[13px] font-medium text-white/70">
          Revenue · {rangeLabel}
        </Text>
        {showChange ? (
          <View className="rounded-full bg-white/15 px-2.5 py-1">
            <Text className="text-[12px] font-semibold text-white">
              {up ? '↗' : '↘'} {Math.abs(changePct!)}%
              {changeLabel ? ` vs ${changeLabel}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-3 text-[32px] font-bold tracking-tight text-white">
        {formatNaira(revenue)}
      </Text>
    </View>
  );
}
