import { Image, Pressable, Text, View } from 'react-native';
import type { Product } from '../../../types/domain';
import { formatNaira } from '../../../utils/money';
import { isLowStock, productSubtitle } from '../../../utils/product';
import { productIconMeta } from '../../../utils/productIcon';

type ProductCardProps = {
  product: Product;
  threshold: number;
  onPress?: () => void;
};

export function ProductCard({ product, threshold, onPress }: ProductCardProps) {
  const low = isLowStock(
    product.quantity,
    product.low_stock_threshold,
    threshold,
  );
  const { Icon, iconColor, bgClass } = productIconMeta(
    product.name,
    product.category,
  );
  const subtitle = productSubtitle(product);

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl bg-surface px-3 py-3 active:opacity-90"
      onPress={onPress}
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          className="h-14 w-14 rounded-[14px] bg-background"
          resizeMode="cover"
        />
      ) : (
        <View
          className={`h-14 w-14 items-center justify-center rounded-[14px] ${bgClass}`}
        >
          <Icon color={iconColor} size={24} strokeWidth={1.8} />
        </View>
      )}

      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-start justify-between gap-3">
          <Text
            className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-text"
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text className="text-[15px] font-bold tabular-nums text-text">
            {formatNaira(Number(product.selling_price))}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="min-w-0 flex-1 text-[13px] leading-4 text-text-muted"
            numberOfLines={1}
          >
            {subtitle}
          </Text>

          {low ? (
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[13px] font-semibold tabular-nums text-accent">
                {product.quantity}
              </Text>
              <View className="rounded-full bg-accent-tint px-2 py-0.5">
                <Text className="text-[11px] font-semibold text-accent">Low</Text>
              </View>
            </View>
          ) : (
            <Text className="text-[13px] tabular-nums text-text-subtle">
              <Text className="font-semibold text-text">{product.quantity}</Text>
              {' in stock'}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
