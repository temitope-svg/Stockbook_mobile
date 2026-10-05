import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  ChevronRight,
  Package,
  RefreshCw,
  Scale,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthContext';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import { formatNaira } from '../../utils/money';
import {
  formatRelativeTime,
  NOTIFICATION_GROUP_LABELS,
  notificationTimeGroup,
  type NotificationTimeGroup,
} from '../../utils/relativeTime';
import {
  useNotifications,
  type NotificationItem,
  type NotificationKind,
} from './hooks/useNotifications';
import { useNotificationReads } from './hooks/useNotificationReads';
import type { MoreStackParamList } from './MoreStack';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'Notifications'>;
type Filter = 'all' | NotificationKind;

const FILTERS: {
  value: Filter;
  label: string;
  Icon: LucideIcon | null;
}[] = [
  { value: 'all', label: 'All', Icon: null },
  { value: 'low_stock', label: 'Stock', Icon: Package },
  { value: 'debt', label: 'Debts', Icon: Scale },
  { value: 'sync', label: 'Sync', Icon: RefreshCw },
];

function kindMeta(kind: NotificationKind) {
  if (kind === 'low_stock') {
    return {
      Icon: AlertTriangle,
      accent: colors.accent,
      tint: colors.accentTint,
      label: 'Low stock',
    };
  }
  if (kind === 'sync') {
    return {
      Icon: RefreshCw,
      accent: colors.danger,
      tint: colors.dangerTint,
      label: 'Sync',
    };
  }
  return {
    Icon: UserRound,
    accent: colors.danger,
    tint: colors.dangerTint,
    label: 'Follow up',
  };
}

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuth();
  const { data, loading } = useNotifications();
  const items = data?.items ?? [];
  const { isRead, markRead, markAllRead, unreadCount } = useNotificationReads(
    shopId,
    items,
  );
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(item => item.kind === filter);
  }, [items, filter]);

  const groups = useMemo(() => {
    const order: NotificationTimeGroup[] = ['today', 'week', 'earlier'];
    const map: Record<NotificationTimeGroup, NotificationItem[]> = {
      today: [],
      week: [],
      earlier: [],
    };
    for (const item of filtered) {
      map[notificationTimeGroup(item.occurredAt)].push(item);
    }
    return order
      .map(key => ({
        key,
        label: NOTIFICATION_GROUP_LABELS[key],
        items: map[key],
      }))
      .filter(group => group.items.length > 0);
  }, [filtered]);

  const counts: Record<Filter, number> = {
    all: items.length,
    low_stock: data?.lowStockCount ?? 0,
    debt: data?.debtCount ?? 0,
    sync: data?.syncCount ?? 0,
  };

  function onOpenItem(item: NotificationItem) {
    void markRead(item);
    const parent = navigation.getParent();
    if (!parent) return;
    if (item.kind === 'low_stock' && item.productId) {
      pushInTab(parent, 'ProductsTab', 'ProductsList', 'ProductDetail', {
        productId: item.productId,
      });
      return;
    }
    if (item.kind === 'debt' && item.customerId) {
      pushInTab(parent, 'CustomersTab', 'CustomersList', 'CustomerDetail', {
        customerId: item.customerId,
      });
      return;
    }
    if (item.kind === 'sync') {
      pushInTab(parent, 'SalesTab', 'SalesList', 'SalesList');
    }
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 pt-2">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => goBackInStack(navigation, 'MoreHome')}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
          >
            <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
          </Pressable>
          <Text className="ml-3 flex-1 text-[22px] font-bold tracking-tight text-text">
            Notifications
          </Text>
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllRead()}
              className="active:opacity-70"
            >
              <Text className="text-[13px] font-semibold text-primary">
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Attention strip */}
        <View
          className="mt-4 overflow-hidden rounded-2xl bg-primary"
          style={{ paddingHorizontal: 16, paddingVertical: 14 }}
        >
          <Text className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/70">
            Inbox
          </Text>
          <Text className="mt-1 text-[20px] font-bold text-white">
            {unreadCount > 0
              ? `${unreadCount} need${unreadCount === 1 ? 's' : ''} you`
              : items.length === 0
                ? 'All clear'
                : 'You’re caught up'}
          </Text>
          <Text className="mt-1 text-[13px] text-white/75">
            {counts.low_stock} stock · {counts.debt} debts · {counts.sync} sync
          </Text>
        </View>

        {/* Segmented filters */}
        <View
          className="mt-4 rounded-2xl bg-surface p-1.5"
          style={{ flexDirection: 'row', gap: 4 }}
        >
          {FILTERS.map(opt => {
            const selected = filter === opt.value;
            const Icon = opt.Icon;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setFilter(opt.value)}
                className={
                  selected
                    ? 'flex-1 items-center rounded-xl bg-primary py-2.5 active:opacity-90'
                    : 'flex-1 items-center rounded-xl py-2.5 active:opacity-70'
                }
              >
                {Icon ? (
                  <Icon
                    color={selected ? colors.white : colors.textSubtle}
                    size={16}
                    strokeWidth={2}
                  />
                ) : (
                  <Bell
                    color={selected ? colors.white : colors.textSubtle}
                    size={16}
                    strokeWidth={2}
                  />
                )}
                <Text
                  className={
                    selected
                      ? 'mt-1 text-[11px] font-semibold text-white'
                      : 'mt-1 text-[11px] font-semibold text-text-muted'
                  }
                >
                  {opt.label}
                </Text>
                <Text
                  className={
                    selected
                      ? 'text-[10px] font-bold text-white/75'
                      : 'text-[10px] font-bold text-text-subtle'
                  }
                >
                  {counts[opt.value]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          className="mt-4 flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32 + Math.max(insets.bottom, 8),
          }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View className="items-center rounded-3xl bg-surface px-6 py-14">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-tint">
                <Bell color={colors.primary} size={24} strokeWidth={1.8} />
              </View>
              <Text className="mt-4 text-[16px] font-bold text-text">
                Nothing here
              </Text>
              <Text className="mt-1.5 max-w-[240px] text-center text-[13px] leading-5 text-text-muted">
                {filter === 'all'
                  ? 'Low stock and unpaid debts show up here when they need you.'
                  : filter === 'low_stock'
                    ? 'No products are low on stock.'
                    : filter === 'debt'
                      ? 'No debts in your reminder window.'
                      : 'Sync conflicts appear when offline sales clash.'}
              </Text>
            </View>
          ) : (
            groups.map(group => (
              <View key={group.key} className="mb-5">
                <View
                  className="mb-2 px-1"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
                    {group.label}
                  </Text>
                  <Text className="text-[11px] font-semibold text-text-subtle">
                    {group.items.length}
                  </Text>
                </View>

                <View className="overflow-hidden rounded-3xl bg-surface">
                  {group.items.map((item, index) => (
                    <InboxRow
                      key={item.id}
                      item={item}
                      read={isRead(item)}
                      showDivider={index < group.items.length - 1}
                      onPress={() => onOpenItem(item)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function InboxRow({
  item,
  read,
  showDivider,
  onPress,
}: {
  item: NotificationItem;
  read: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  const meta = kindMeta(item.kind);
  const Icon = meta.Icon;
  const when = formatRelativeTime(item.occurredAt);
  const isSync = item.kind === 'sync';

  const detail =
    item.kind === 'debt' && item.owedAmount != null
      ? `Owes ${formatNaira(item.owedAmount)}`
      : meta.label;

  if (isSync) {
    return (
      <Pressable
        onPress={onPress}
        className="bg-danger-tint px-4 py-4 active:opacity-90"
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.65)' }}
          >
            <Icon color={meta.accent} size={18} strokeWidth={2} />
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <Text className="text-[14px] font-bold text-text">{item.title}</Text>
            <Text className="mt-1 text-[12px] leading-4 text-text-muted">
              Review the conflicting sale and fix stock.
            </Text>
            <View
              className="mt-3"
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <View className="rounded-lg bg-text px-3 py-1.5">
                <Text className="text-[11px] font-semibold text-white">
                  Review sale
                </Text>
              </View>
              <Text className="ml-3 text-[11px] text-text-subtle">{when}</Text>
            </View>
          </View>
          {!read ? (
            <View
              className="ml-2 mt-1 h-2 w-2 rounded-full"
              style={{ backgroundColor: meta.accent }}
            />
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={
        showDivider
          ? 'border-b border-text/5 active:bg-background'
          : 'active:bg-background'
      }
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        {!read ? (
          <View
            className="mr-2 h-9 w-1 rounded-full"
            style={{ backgroundColor: meta.accent }}
          />
        ) : (
          <View className="mr-2 h-9 w-1" />
        )}

        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: meta.tint }}
        >
          <Icon color={meta.accent} size={17} strokeWidth={2} />
        </View>

        <View className="ml-3 min-w-0 flex-1">
          <Text
            className={
              read
                ? 'text-[14px] font-medium text-text-muted'
                : 'text-[14px] font-bold text-text'
            }
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="mt-0.5 text-[12px] text-text-subtle"
            numberOfLines={1}
          >
            {detail}
          </Text>
        </View>

        <View className="ml-2 items-end">
          <Text className="text-[11px] font-medium text-text-subtle">{when}</Text>
          <View
            className="mt-1.5"
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            {!read ? (
              <View
                className="mr-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: meta.accent }}
              />
            ) : null}
            <ChevronRight
              color={colors.textSubtle}
              size={16}
              strokeWidth={1.8}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
