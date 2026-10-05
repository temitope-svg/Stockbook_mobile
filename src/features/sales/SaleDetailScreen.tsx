import {
  ArrowLeft,
  Building2,
  Check,
  Ellipsis,
  Printer,
  Share2,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNPrint from 'react-native-print';
import Share from 'react-native-share';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { useAuth } from '../../auth/AuthContext';
import { useOffline } from '../../offline/OfflineContext';
import { discardOutboxSale } from '../../offline/outbox';
import { forceRetryOutboxItem } from '../../offline/syncWorker';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import { formatNaira } from '../../utils/money';
import { paymentMethodLabel } from '../../utils/paymentMethod';
import { productIconMeta } from '../../utils/productIcon';
import {
  formatSaleReceiptDate,
  paymentStatusLabel,
  saleShortId,
} from '../../utils/sales';
import { SaleReceiptCard } from './components/SaleReceiptCard';
import { useSaleDetail } from './hooks/useSaleDetail';
import type { SalesStackParamList } from './SalesStack';
import { buildSaleReceiptModel } from './utils/saleReceipt';
import { buildSaleReceiptHtml } from './utils/saleReceiptHtml';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<SalesStackParamList, 'SaleDetail'>;

function statusTone(status: string) {
  if (status === 'paid') {
    return {
      label: paymentStatusLabel(status),
      bg: 'bg-white',
      text: 'text-primary',
    };
  }
  if (status === 'credit') {
    return {
      label: paymentStatusLabel(status),
      bg: 'bg-accent-tint',
      text: 'text-accent',
    };
  }
  return {
    label: paymentStatusLabel(status),
    bg: 'bg-danger-tint',
    text: 'text-danger',
  };
}

function roleLabel(role: string | null | undefined) {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function SaleDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { shopId, profile, membership, role } = useAuth();
  const { isOnline, refreshOfflineState } = useOffline();
  const { data, loading, error, refresh } = useSaleDetail(
    route.params.saleId,
    Boolean(route.params.pending),
  );
  const [retrying, setRetrying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const receiptRef = useRef<ViewShotRef>(null);

  const receipt = useMemo(() => {
    if (!data) return null;
    return buildSaleReceiptModel(
      data,
      profile?.shop_name?.trim() || 'StockBook',
      profile?.phone_number,
    );
  }, [data, profile?.shop_name, profile?.phone_number]);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  async function onRetrySync() {
    if (!shopId || !data) return;
    if (!isOnline) {
      Alert.alert('You’re offline', 'Connect to the internet, then try again.');
      return;
    }
    setRetrying(true);
    try {
      const result = await forceRetryOutboxItem(shopId, data.id);
      await refreshOfflineState();
      if (result.synced > 0) {
        await refresh();
        return;
      }
      await refresh();
      if (result.failed > 0) {
        Alert.alert(
          'Still couldn’t sync',
          'You can retry again, or remove this local copy from the phone.',
        );
      }
    } finally {
      setRetrying(false);
    }
  }

  function onDiscardLocal() {
    if (!shopId || !data) return;
    Alert.alert(
      'Remove from this phone?',
      'This clears the stuck sync copy. It will not delete any sale that already reached the server. Stock held for this local sale will be put back.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await discardOutboxSale(shopId, data.id);
              await refreshOfflineState();
              goBackInStack(navigation, 'SalesList');
            })();
          },
        },
      ],
    );
  }

  async function onShare() {
    if (!data || !receiptRef.current) return;
    setSharing(true);
    try {
      const uri = await receiptRef.current.capture();
      const fileUrl = uri.startsWith('file://') ? uri : `file://${uri}`;
      await Share.open({
        title: `Sale #${saleShortId(data.id)}`,
        url: fileUrl,
        type: 'image/png',
        filename: `stockbook-receipt-${saleShortId(data.id)}`,
        failOnCancel: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (/cancel/i.test(msg) || /User did not share/i.test(msg)) return;
      Alert.alert(
        "Couldn't share receipt",
        'Try Print instead, or pick another app to share to.',
      );
    } finally {
      setSharing(false);
    }
  }

  async function onPrint() {
    if (!data) return;
    try {
      await RNPrint.print({
        jobName: `Sale #${saleShortId(data.id)}`,
        html: buildSaleReceiptHtml({
          sale: data,
          shopName: profile?.shop_name?.trim() || 'StockBook',
          shopPhone: profile?.phone_number,
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (/cancel/i.test(msg)) return;
      Alert.alert(
        "Couldn't print",
        'Check that a printer is available, or use Share receipt instead.',
      );
    }
  }

  function onMore() {
    if (!data) return;
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [
      { text: 'Print receipt', onPress: () => void onPrint() },
      { text: 'Share receipt', onPress: () => void onShare() },
    ];
    if (data.customerId) {
      buttons.push({
        text: 'View customer',
        onPress: () => {
          const parent = navigation.getParent();
          if (!parent) return;
          pushInTab(parent, 'CustomersTab', 'CustomersList', 'CustomerDetail', {
            customerId: data.customerId!,
          });
        },
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Sale options', undefined, buttons);
  }

  if (loading && !data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-[16px] font-semibold text-text">
          Sale not found
        </Text>
        {error ? (
          <Text className="mt-2 text-center text-[13px] text-danger">
            {error}
          </Text>
        ) : null}
        <Pressable
          className="mt-4 active:opacity-70"
          onPress={() => goBackInStack(navigation, 'SalesList')}
        >
          <Text className="text-[14px] font-semibold text-primary">
            Back to sales
          </Text>
        </Pressable>
      </View>
    );
  }

  const status = statusTone(data.paymentStatus);
  const customerLabel = data.customerName?.trim() || 'Walk-in';
  const methodLabel = paymentMethodLabel(data.paymentMethod);
  const recordedName =
    membership?.display_name?.trim() ||
    profile?.owner_name?.trim() ||
    profile?.shop_name?.trim() ||
    'Team';
  const recordedRole = roleLabel(role);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {data.pending || data.pendingFailed ? (
        <View
          className={
            data.pendingFailed
              ? 'mx-5 mb-2 rounded-2xl bg-danger-tint px-4 py-3'
              : 'mx-5 mb-2 rounded-2xl bg-accent-tint px-4 py-3'
          }
        >
          <Text
            className={
              data.pendingFailed
                ? 'text-[13px] font-semibold text-danger'
                : 'text-[13px] font-semibold text-accent'
            }
          >
            {data.pendingFailed
              ? 'This sale couldn’t sync'
              : 'Pending sync — saved on this phone'}
          </Text>
          <Text
            className={
              data.pendingFailed
                ? 'mt-0.5 text-[12px] text-danger/80'
                : 'mt-0.5 text-[12px] text-accent/80'
            }
          >
            {data.pendingFailed
              ? data.pendingError ||
                'Check stock and try syncing from More when online.'
              : 'It will upload automatically when you’re back online.'}
          </Text>
          {data.pendingFailed ? (
            <View className="mt-2 flex-row flex-wrap gap-2">
              <Pressable
                className="rounded-xl bg-danger/15 px-3 py-2 active:opacity-80"
                disabled={retrying}
                onPress={() => void onRetrySync()}
              >
                {retrying ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <Text className="text-[12px] font-semibold text-danger">
                    Retry sync
                  </Text>
                )}
              </Pressable>
              <Pressable
                className="rounded-xl bg-surface px-3 py-2 active:opacity-80"
                disabled={retrying}
                onPress={onDiscardLocal}
              >
                <Text className="text-[12px] font-semibold text-text-muted">
                  Remove from phone
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'SalesList')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <Text className="text-[17px] font-bold text-text">
          Sale #{saleShortId(data.id)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={onMore}
        >
          <Ellipsis color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24 + Math.max(insets.bottom, 8),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2 overflow-hidden rounded-[28px] bg-primary px-5 py-5">
          <View
            className={`self-start rounded-full px-2.5 py-1 ${status.bg}`}
          >
            <View className="flex-row items-center gap-1">
              {data.paymentStatus === 'paid' ? (
                <Check color={colors.primary} size={12} strokeWidth={2.6} />
              ) : null}
              <Text className={`text-[11px] font-semibold ${status.text}`}>
                {status.label}
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-[12px] font-medium text-white/70">
            Total sale value
          </Text>
          <Text className="mt-1 text-[34px] font-bold tracking-tight text-white">
            {formatNaira(data.totalAmount)}
          </Text>
          <Text className="mt-2 text-[13px] text-white/75">
            {formatSaleReceiptDate(data.createdAt)}
          </Text>
        </View>

        <View className="mt-3 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
              Items
            </Text>
            <Text className="mt-2 text-[26px] font-bold text-text">
              {data.itemCount}
            </Text>
            <Text className="mt-1 text-[13px] text-text-muted">
              across {data.items.length} product
              {data.items.length === 1 ? '' : 's'}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-surface px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
              Customer
            </Text>
            <View className="mt-3 flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                <UserRound
                  color={colors.textSubtle}
                  size={16}
                  strokeWidth={1.8}
                />
              </View>
              <Text
                className="min-w-0 flex-1 text-[15px] font-semibold text-text"
                numberOfLines={1}
              >
                {customerLabel}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 rounded-2xl bg-surface px-4">
          <View className="flex-row items-center justify-between border-b border-text/5 py-3.5">
            <Text className="text-[14px] text-text-muted">Payment method</Text>
            <View className="flex-row items-center gap-1.5">
              {methodLabel ? (
                <Building2
                  color={colors.textSubtle}
                  size={15}
                  strokeWidth={1.8}
                />
              ) : null}
              <Text className="text-[14px] font-semibold text-text">
                {methodLabel ?? '—'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between py-3.5">
            <Text className="text-[14px] text-text-muted">Recorded by</Text>
            <Text className="text-[14px] font-semibold text-text">
              {recordedName}
              {recordedRole ? ` · ${recordedRole}` : ''}
            </Text>
          </View>
        </View>

        {data.debtRemaining != null && data.debtRemaining > 0 ? (
          <View className="mt-3 rounded-2xl bg-accent-tint px-4 py-3.5">
            <Text className="text-[13px] font-medium text-accent">
              Remaining balance · {formatNaira(data.debtRemaining)}
            </Text>
          </View>
        ) : null}

        <Text className="mb-3 mt-5 text-[17px] font-bold text-text">
          Goods sold
        </Text>

        <View className="gap-2">
          {data.items.map(item => {
            const { Icon, iconColor, bgClass } = productIconMeta(
              item.productName,
              item.category,
            );
            return (
              <View
                key={item.id}
                className="flex-row items-center gap-3 rounded-2xl bg-surface px-3 py-3"
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="h-12 w-12 rounded-[14px] bg-background"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className={`h-12 w-12 items-center justify-center rounded-[14px] ${bgClass}`}
                  >
                    <Icon color={iconColor} size={22} strokeWidth={1.8} />
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[15px] font-semibold text-text"
                    numberOfLines={1}
                  >
                    {item.productName}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-text-muted">
                    {item.quantity} × {formatNaira(item.unitPrice)}
                  </Text>
                </View>
                <Text className="text-[15px] font-bold text-text">
                  {formatNaira(item.subtotal)}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="mt-5 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            disabled={sharing}
            className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
            onPress={() => void onShare()}
          >
            {sharing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Share2 color={colors.white} size={18} strokeWidth={2} />
                <Text className="text-[15px] font-semibold text-white">
                  Share receipt
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-text/10 bg-surface px-5 active:opacity-90"
            onPress={() => void onPrint()}
          >
            <Printer color={colors.text} size={18} strokeWidth={1.8} />
            <Text className="text-[15px] font-semibold text-text">Print</Text>
          </Pressable>
        </View>
      </ScrollView>

      {receipt ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: -10000, top: 0 }}
        >
          <ViewShot
            ref={receiptRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          >
            <SaleReceiptCard receipt={receipt} />
          </ViewShot>
        </View>
      ) : null}
    </View>
  );
}
