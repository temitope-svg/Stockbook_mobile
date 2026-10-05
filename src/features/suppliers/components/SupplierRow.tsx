import { Store } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { avatarTone } from '../../../utils/customer';
import { formatCompactNaira } from '../../../utils/money';
import type { SupplierListRow } from '../types';

function formatLastRestock(iso: string | null) {
  if (!iso) return 'No restocks yet';
  const date = new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  return `Last restock ${date}`;
}

const TONE_COLORS = [
  colors.danger,
  colors.accent,
  colors.primary,
  colors.teal,
  '#4338ca',
] as const;

type SupplierRowProps = {
  supplier: SupplierListRow;
  showDivider?: boolean;
  onPress: () => void;
};

export function SupplierRow({
  supplier,
  showDivider = true,
  onPress,
}: SupplierRowProps) {
  const tone = avatarTone(supplier.name);
  const hash = [...supplier.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const iconColor = TONE_COLORS[hash % TONE_COLORS.length];

  return (
    <Pressable
      onPress={onPress}
      className={
        showDivider
          ? 'flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:bg-background'
          : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-background'
      }
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-xl ${tone.bg}`}
      >
        <Store color={iconColor} size={18} strokeWidth={1.9} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-text" numberOfLines={1}>
          {supplier.name}
        </Text>
        <Text className="mt-0.5 text-[12px] text-text-subtle">
          {formatLastRestock(supplier.lastRestockAt)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-[15px] font-bold text-text">
          {formatCompactNaira(supplier.spend)}
        </Text>
        <Text className="mt-0.5 text-[11px] text-text-subtle">total spend</Text>
      </View>
    </Pressable>
  );
}
