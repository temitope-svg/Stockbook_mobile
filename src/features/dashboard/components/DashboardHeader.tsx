import { Bell } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useOfflineOptional } from '../../../offline/OfflineContext';
import { syncBadgeLabel } from '../../../offline/statusLabel';
import { colors } from '../../../theme/colors';
import { greetingForNow } from '../../../utils/greeting';

type DashboardHeaderProps = {
  shopName: string;
  notificationCount?: number;
  onNotificationsPress?: () => void;
};

export function DashboardHeader({
  shopName,
  notificationCount = 0,
  onNotificationsPress,
}: DashboardHeaderProps) {
  const offline = useOfflineOptional();
  const badge = offline
    ? syncBadgeLabel({
        isOnline: offline.isOnline,
        pendingCount: offline.pendingCount,
        failedCount: offline.failedCount,
      })
    : 'Synced';
  const badgeTone =
    offline && (!offline.isOnline || offline.failedCount > 0 || offline.pendingCount > 0)
      ? 'warn'
      : 'ok';

  return (
    <View className="flex-row items-start justify-between px-5 pt-2">
      <View className="min-w-0 flex-1 pr-3">
        <Text className="text-[15px] text-text-muted">{greetingForNow()}</Text>
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          <Text
            className="text-[26px] font-bold tracking-tight text-text"
            numberOfLines={1}
          >
            {shopName}
          </Text>
          <View
            className={
              badgeTone === 'ok'
                ? 'flex-row items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-1'
                : 'flex-row items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1'
            }
          >
            <View
              className={
                badgeTone === 'ok'
                  ? 'h-1.5 w-1.5 rounded-full bg-primary'
                  : 'h-1.5 w-1.5 rounded-full bg-accent'
              }
            />
            <Text
              className={
                badgeTone === 'ok'
                  ? 'text-[12px] font-semibold text-primary'
                  : 'text-[12px] font-semibold text-accent'
              }
              numberOfLines={1}
            >
              {badge}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
        onPress={onNotificationsPress}
        hitSlop={6}
      >
        <Bell color={colors.text} size={20} strokeWidth={1.8} />
        {notificationCount > 0 ? (
          <View className="absolute -right-0.5 -top-0.5 min-w-[18px] items-center rounded-full bg-accent px-1 py-0.5">
            <Text className="text-[10px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
