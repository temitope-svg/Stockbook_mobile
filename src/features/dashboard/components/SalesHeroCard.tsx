import { Text, useWindowDimensions, View } from 'react-native';
import { formatNaira } from '../../../utils/money';
import { SalesSparkline } from './SalesSparkline';

type SalesHeroCardProps = {
  todaySales: number;
  yesterdaySales: number;
  saleCount: number;
};

export function SalesHeroCard({
  todaySales,
  yesterdaySales,
  saleCount,
}: SalesHeroCardProps) {
  const { width } = useWindowDimensions();
  const sparkWidth = Math.min(width - 72, 280);

  const avg = saleCount > 0 ? todaySales / saleCount : 0;
  const delta =
    yesterdaySales > 0
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : todaySales > 0
        ? 100
        : 0;
  const showDelta = yesterdaySales > 0 || todaySales > 0;

  return (
    <View className="mx-5 overflow-hidden rounded-[28px] bg-primary px-5 pb-4 pt-5">
      <View
        pointerEvents="none"
        className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-black/10"
      />

      <View className="relative">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-[13px] font-medium text-primary-tint/80">
            Today's sales
          </Text>
          {showDelta ? (
            <View className="shrink-0 rounded-full bg-white/15 px-2.5 py-1">
              <Text className="text-[11px] font-semibold text-white">
                {delta >= 0 ? '↗' : '↘'} {Math.abs(delta)}% vs yesterday
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.45}
          allowFontScaling={false}
          className="mt-1.5 text-[34px] font-bold tracking-tight text-white"
        >
          {formatNaira(todaySales)}
        </Text>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          className="mt-1.5 text-[13px] text-primary-tint/75"
        >
          {saleCount} sale{saleCount === 1 ? '' : 's'}
          {saleCount > 0 ? ` · avg ${formatNaira(avg)}` : ''}
        </Text>
      </View>

      <View className="mt-4 items-end">
        <SalesSparkline width={sparkWidth} height={52} />
      </View>
    </View>
  );
}
