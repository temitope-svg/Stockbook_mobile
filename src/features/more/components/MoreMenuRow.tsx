import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type MoreMenuRowProps = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: number;
  showDivider?: boolean;
  onPress: () => void;
};

export function MoreMenuRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  badge,
  showDivider = true,
  onPress,
}: MoreMenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className={
        showDivider
          ? 'border-b border-text/5 px-4 py-3.5 active:bg-background'
          : 'px-4 py-3.5 active:bg-background'
      }
      style={{ flexDirection: 'row', alignItems: 'center' }}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon color={iconColor} size={18} strokeWidth={1.9} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-text">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[12px] text-text-subtle" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge != null && badge > 0 ? (
        <View className="mr-2 h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5">
          <Text className="text-[11px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      ) : null}
      <ChevronRight color={colors.textSubtle} size={18} strokeWidth={1.8} />
    </Pressable>
  );
}
