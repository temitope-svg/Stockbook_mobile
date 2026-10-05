import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';
import { colors } from '../../../theme/colors';

type SalesPerformanceChartProps = {
  points: number[];
  height?: number;
};

export function SalesPerformanceChart({
  points,
  height = 120,
}: SalesPerformanceChartProps) {
  const width = 320;
  const data = points.length > 1 ? points : [0, 0, 0, 1, 0, 0, 0];
  const max = Math.max(...data, 1);
  const step = width / Math.max(data.length - 1, 1);

  const coords = data.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 16) - 8;
    return { x, y };
  });

  const line = coords
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(' ');

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View className="overflow-hidden">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#salesFill)" />
        <Path
          d={line}
          stroke={colors.primary}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
