import { useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { formatCompactNaira } from '../../../utils/money';
import type { InsightsChartPoint } from '../hooks/useShopInsights';

type InsightsTrendChartProps = {
  buckets: InsightsChartPoint[];
  weekly: boolean;
};

export function InsightsTrendChart({
  buckets,
  weekly,
}: InsightsTrendChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 80, 260);
  const chartHeight = 140;

  const best = useMemo(() => {
    if (buckets.length === 0) return null;
    return buckets.reduce((a, b) => (b.total > a.total ? b : a));
  }, [buckets]);

  const path = useMemo(() => {
    if (buckets.length === 0) return null;
    const max = Math.max(...buckets.map(b => b.total), 1);
    const step = chartWidth / Math.max(buckets.length - 1, 1);
    const coords = buckets.map((bucket, index) => {
      const x = index * step;
      const y =
        chartHeight - (bucket.total / max) * (chartHeight - 20) - 10;
      return { x, y };
    });

    if (coords.length === 1) {
      const p = coords[0];
      return {
        line: `M 0 ${p.y} L ${chartWidth} ${p.y}`,
        area: `M 0 ${p.y} L ${chartWidth} ${p.y} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`,
        coords,
      };
    }

    const line = coords
      .map((point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
      )
      .join(' ');
    const area = `${line} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
    return { line, area, coords };
  }, [buckets, chartWidth, chartHeight]);

  const labelIndexes = useMemo(() => {
    if (buckets.length === 0) return [];
    if (buckets.length <= 3) return buckets.map((_, i) => i);
    return [0, Math.floor((buckets.length - 1) / 2), buckets.length - 1];
  }, [buckets]);

  return (
    <View className="rounded-[22px] bg-surface px-4 py-4">
      <Text className="text-[16px] font-bold text-text">Revenue trend</Text>
      <Text className="mt-0.5 text-[12px] text-text-muted">
        {best && best.total > 0
          ? `Best ${weekly ? 'week' : 'day'}: ${best.label} · ${formatCompactNaira(best.total)}`
          : weekly
            ? 'Weekly totals for this range'
            : 'Daily money through the till'}
      </Text>

      {buckets.length === 0 || !path ? (
        <View className="mt-8 h-28 items-center justify-center">
          <Text className="text-[13px] text-text-muted">
            No sales in this period yet.
          </Text>
        </View>
      ) : (
        <View className="mt-4">
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="insightsFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            {[0.25, 0.5, 0.75].map(ratio => (
              <Line
                key={ratio}
                x1={0}
                x2={chartWidth}
                y1={chartHeight * ratio}
                y2={chartHeight * ratio}
                stroke="rgba(44,44,42,0.06)"
                strokeWidth={1}
              />
            ))}
            <Path d={path.area} fill="url(#insightsFill)" />
            <Path
              d={path.line}
              stroke={colors.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          <View className="mt-2 flex-row justify-between">
            {labelIndexes.map(index => (
              <Text
                key={buckets[index].key}
                className="text-[11px] font-medium text-text-subtle"
              >
                {buckets[index].label}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
