import {
  Banknote,
  Package,
  Plus,
  Truck,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Action = {
  key: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  onPress?: () => void;
};

type QuickActionsProps = {
  onSale?: () => void;
  onProduct?: () => void;
  onPayment?: () => void;
  onRestock?: () => void;
};

export function QuickActions({
  onSale,
  onProduct,
  onPayment,
  onRestock,
}: QuickActionsProps) {
  const actions: Action[] = [
    { key: 'sale', label: 'Sale', icon: Plus, primary: true, onPress: onSale },
    { key: 'product', label: 'Product', icon: Package, onPress: onProduct },
    { key: 'payment', label: 'Payment', icon: Banknote, onPress: onPayment },
    { key: 'restock', label: 'Restock', icon: Truck, onPress: onRestock },
  ];

  return (
    <View className="mx-5 flex-row gap-3">
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            className="flex-1 items-center active:opacity-80"
            onPress={action.onPress}
          >
            <View
              className={
                action.primary
                  ? 'h-16 w-16 items-center justify-center rounded-[18px] bg-accent'
                  : 'h-16 w-16 items-center justify-center rounded-[18px] border border-text/10 bg-surface'
              }
            >
              <Icon
                color={action.primary ? colors.white : colors.primary}
                size={24}
                strokeWidth={action.primary ? 2.4 : 1.8}
              />
            </View>
            <Text
              className={
                action.primary
                  ? 'mt-2 text-[13px] font-semibold text-text'
                  : 'mt-2 text-[13px] font-medium text-text'
              }
              numberOfLines={1}
            >
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
