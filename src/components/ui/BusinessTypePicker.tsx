import {
  Check,
  Pill,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Store,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { BUSINESS_TYPE_OPTIONS } from '../../lib/businessTypes';
import type { BusinessType } from '../../types/domain';
import { colors } from '../../theme/colors';

const ICONS = {
  phones_gadgets: Smartphone,
  fashion: Shirt,
  provisions: ShoppingBasket,
  pharmacy: Pill,
  general: Store,
} as const;

type BusinessTypePickerProps = {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
};

export function BusinessTypePicker({
  value,
  onChange,
}: BusinessTypePickerProps) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-2.5">
      {BUSINESS_TYPE_OPTIONS.map(option => {
        const selected = value === option.value;
        const Icon = ICONS[option.value];
        const fullWidth = option.value === 'general';

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            className={
              selected
                ? `${fullWidth ? 'w-full' : 'w-[48%]'} rounded-2xl border border-primary bg-primary-tint px-3.5 py-4`
                : `${fullWidth ? 'w-full' : 'w-[48%]'} rounded-2xl border border-text/10 bg-surface px-3.5 py-4`
            }
          >
            <View
              className={
                selected
                  ? 'mb-3 h-7 w-7 items-center justify-center rounded-lg bg-primary'
                  : 'mb-3 h-7 w-7 items-center justify-center rounded-lg border border-text/15 bg-background'
              }
            >
              {selected ? (
                <Check color={colors.white} size={14} strokeWidth={2.5} />
              ) : (
                <Icon color={colors.textMuted} size={14} strokeWidth={1.8} />
              )}
            </View>
            <Text
              className={
                selected
                  ? 'text-[14px] font-semibold tracking-tight text-primary'
                  : 'text-[14px] font-semibold tracking-tight text-text'
              }
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
