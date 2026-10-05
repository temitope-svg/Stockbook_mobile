import {
  BarChart3,
  Bell,
  ChevronRight,
  CloudCheck,
  CloudOff,
  HelpCircle,
  LogOut,
  Settings,
  Store,
  Users,
} from 'lucide-react-native';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { permissionsFor } from '../../auth/permissions';
import { BUSINESS_TYPE_OPTIONS } from '../../lib/businessTypes';
import { useOffline } from '../../offline/OfflineContext';
import { alertNeedsConnection } from '../../offline/requireOnline';
import {
  formatLastSynced,
  syncBadgeLabel,
} from '../../offline/statusLabel';
import { colors } from '../../theme/colors';
import { initials } from '../../utils/initials';
import { MoreMenuRow } from './components/MoreMenuRow';
import { useNotifications } from './hooks/useNotifications';
import { useNotificationReads } from './hooks/useNotificationReads';
import { useTeamCount } from './hooks/useTeamCount';
import type { MoreStackParamList } from './MoreStack';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreHome'>;

function roleLabel(role: string | null) {
  if (!role) return 'Member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function MoreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, role, shopId, signOut } = useAuth();
  const permissions = permissionsFor(role);
  const teamCount = useTeamCount();
  const { data } = useNotifications();
  const items = data?.items ?? [];
  const { unreadCount } = useNotificationReads(shopId, items);
  const {
    isOnline,
    pendingCount,
    failedCount,
    lastSyncAt,
    syncNow,
  } = useOffline();
  const syncTitle = syncBadgeLabel({ isOnline, pendingCount, failedCount });
  const syncSubtitle = isOnline
    ? `Last synced ${formatLastSynced(lastSyncAt)}`
    : pendingCount > 0
      ? `${pendingCount} sale${pendingCount === 1 ? '' : 's'} waiting to sync`
      : 'Showing saved products and customers';
  const SyncIcon = isOnline ? CloudCheck : CloudOff;

  const shopName = profile?.shop_name ?? 'Your shop';
  const ownerName = profile?.owner_name?.trim() ?? '';
  const avatarUrl = profile?.avatar_url;
  const businessLabel =
    BUSINESS_TYPE_OPTIONS.find(o => o.value === profile?.business_type)
      ?.label.replace('Something else / general shop', 'General shop') ??
    'Your shop';
  const subtitle = ownerName || businessLabel;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32 + Math.max(insets.bottom, 8),
        }}
      >
        <Text className="text-[28px] font-bold tracking-tight text-text">
          More
        </Text>

        {/* Profile → Settings */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          className="mt-5 flex-row items-center rounded-3xl bg-surface px-4 py-4 active:opacity-90"
          onPress={() => navigation.navigate('Settings')}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="h-12 w-12 rounded-full bg-primary-tint"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-tint">
              <Text className="text-[15px] font-bold text-primary">
                {initials(ownerName || shopName)}
              </Text>
            </View>
          )}
          <View className="ml-3 min-w-0 flex-1">
            <Text className="text-[16px] font-bold text-text" numberOfLines={1}>
              {shopName}
            </Text>
            <Text
              className="mt-0.5 text-[13px] text-text-muted"
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
          <View className="rounded-full bg-accent-tint px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-accent">
              {roleLabel(role)}
            </Text>
          </View>
          <ChevronRight
            color={colors.textSubtle}
            size={18}
            strokeWidth={1.8}
            style={{ marginLeft: 6 }}
          />
        </Pressable>

        {/* Sync */}
        <Pressable
          className="mt-3 rounded-2xl bg-primary-tint px-4 py-3.5 active:opacity-90"
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => {
            if (!isOnline) {
              Alert.alert('You’re offline', syncSubtitle);
              return;
            }
            void syncNow().then(result => {
              if (result.synced === 0 && result.failed === 0) {
                Alert.alert('Up to date', 'Nothing waiting to sync.');
              } else if (result.failed > 0) {
                Alert.alert(
                  'Sync finished with issues',
                  `${result.synced} synced, ${result.failed} need attention. Check Notifications.`,
                );
              } else {
                Alert.alert(
                  'Synced',
                  `${result.synced} sale${result.synced === 1 ? '' : 's'} uploaded.`,
                );
              }
            });
          }}
        >
          <SyncIcon color={colors.primary} size={18} strokeWidth={1.9} />
          <View className="ml-2.5 min-w-0 flex-1">
            <Text className="text-[14px] font-semibold text-primary">
              {syncTitle === 'Synced' ? 'Everything is synced' : syncTitle}
            </Text>
            <Text className="mt-0.5 text-[12px] text-primary/75">
              {syncSubtitle}
            </Text>
          </View>
        </Pressable>

        {/* Run your shop */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
          Run your shop
        </Text>
        <View className="overflow-hidden rounded-3xl bg-surface">
          {permissions.canViewCost ? (
            <MoreMenuRow
              icon={BarChart3}
              iconBg="bg-primary-tint"
              iconColor={colors.primary}
              title="Insights"
              subtitle="Revenue, profit, top products"
              onPress={() => {
                if (!isOnline) {
                  alertNeedsConnection('Insights');
                  return;
                }
                navigation.navigate('Insights');
              }}
            />
          ) : null}
          {permissions.canEditProducts ? (
            <MoreMenuRow
              icon={Store}
              iconBg="bg-accent-tint"
              iconColor={colors.accent}
              title="Suppliers"
              subtitle="Who you buy from"
              onPress={() => {
                if (!isOnline) {
                  alertNeedsConnection('Suppliers');
                  return;
                }
                navigation.navigate('SuppliersList');
              }}
            />
          ) : null}
          <MoreMenuRow
            icon={Users}
            iconBg="bg-danger-tint"
            iconColor={colors.danger}
            title="Team"
            subtitle={
              teamCount > 0
                ? `${teamCount} member${teamCount === 1 ? '' : 's'}`
                : 'Invite staff'
            }
            onPress={() => {
              if (!isOnline) {
                alertNeedsConnection('Team');
                return;
              }
              navigation.navigate('Team');
            }}
          />
          <MoreMenuRow
            icon={Bell}
            iconBg="bg-background"
            iconColor={colors.textMuted}
            title="Notifications"
            badge={unreadCount}
            showDivider={false}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        {/* Shop */}
        <Text className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
          Shop
        </Text>
        <View className="overflow-hidden rounded-3xl bg-surface">
          <MoreMenuRow
            icon={Settings}
            iconBg="bg-background"
            iconColor={colors.textMuted}
            title="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
          <MoreMenuRow
            icon={HelpCircle}
            iconBg="bg-background"
            iconColor={colors.textMuted}
            title="Help & feedback"
            showDivider={false}
            onPress={() => navigation.navigate('Help')}
          />
        </View>

        {/* Log out */}
        <Pressable
          onPress={() => {
            Alert.alert('Log out', 'Sign out of this shop?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log out',
                style: 'destructive',
                onPress: () => void signOut(),
              },
            ]);
          }}
          className="mt-4 rounded-3xl bg-surface px-4 py-3.5 active:opacity-90"
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-danger-tint">
            <LogOut color={colors.danger} size={18} strokeWidth={1.9} />
          </View>
          <Text className="ml-3 text-[15px] font-semibold text-danger">
            Log out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
