import { Trash2 } from 'lucide-react-native';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { QtyStepper } from '../../../components/ui/QtyStepper';
import { colors } from '../../../theme/colors';
import type { Product } from '../../../types/domain';
import { formatNaira } from '../../../utils/money';
import type { SaleCartLine } from '../hooks/useSaleCart';

type SaleCartListProps = {
  lines: SaleCartLine[];
  productById: Map<string, Product>;
  remainingStock: (productId: string, exceptKey?: string) => number;
  onUpdate: (
    key: string,
    patch: Partial<Pick<SaleCartLine, 'quantity' | 'unitPrice'>>,
  ) => { ok: boolean; reason?: string; remaining?: number };
  onRemove: (key: string) => void;
};

export function SaleCartList({
  lines,
  productById,
  remainingStock,
  onUpdate,
  onRemove,
}: SaleCartListProps) {
  if (lines.length === 0) {
    return (
      <View className="items-center rounded-[22px] border border-dashed border-text/10 bg-surface px-5 py-8">
        <Text className="text-[15px] font-semibold text-text">No items yet</Text>
        <Text className="mt-1 text-center text-[13px] text-text-muted">
          Add products above — as many as you need on this sale.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2.5">
      {lines.map(line => {
        const product = productById.get(line.productId);
        if (!product) return null;
        const max = remainingStock(line.productId, line.key);

        function setQty(next: number) {
          const result = onUpdate(line.key, { quantity: next });
          if (!result.ok && result.reason === 'stock') {
            Alert.alert(
              'Not enough stock',
              `Only ${result.remaining} left for ${product!.name}.`,
            );
          }
        }

        return (
          <View
            key={line.key}
            className="rounded-[22px] border border-text/5 bg-surface px-3.5 py-3.5"
          >
            <View className="flex-row items-start gap-3">
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  className="h-11 w-11 rounded-xl bg-background"
                />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-tint">
                  <Text className="text-[13px] font-bold text-primary">
                    {product.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

              <View className="min-w-0 flex-1">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="min-w-0 flex-1">
                    <Text
                      className="text-[15px] font-semibold text-text"
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-text-subtle">
                      {formatNaira(line.quantity * line.unitPrice)}
                      {max < product.quantity
                        ? ` · ${max} left to add`
                        : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${product.name}`}
                    className="h-8 w-8 items-center justify-center rounded-lg active:bg-background"
                    onPress={() => onRemove(line.key)}
                  >
                    <Trash2 color={colors.textSubtle} size={16} strokeWidth={1.8} />
                  </Pressable>
                </View>

                <View className="mt-3 flex-row gap-2">
                  <View className="flex-1">
                    <Text className="mb-1 text-[11px] font-medium text-text-muted">
                      Qty
                    </Text>
                    <QtyStepper
                      value={line.quantity}
                      onChange={setQty}
                      min={1}
                      max={Math.max(max, 1)}
                      size="sm"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="mb-1 text-[11px] font-medium text-text-muted">
                      Price
                    </Text>
                    <View className="h-10 flex-row items-center rounded-xl bg-background px-3">
                      <Text className="text-[14px] font-semibold text-text">₦</Text>
                      <TextInput
                        value={String(Math.round(line.unitPrice))}
                        onChangeText={text => {
                          const digits = text.replace(/\D/g, '');
                          onUpdate(line.key, {
                            unitPrice: digits === '' ? 0 : Number(digits),
                          });
                        }}
                        keyboardType="number-pad"
                        className="ml-1 flex-1 text-[15px] font-semibold text-text"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
