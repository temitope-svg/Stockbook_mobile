import {
  ArrowLeft,
  FileText,
  MessageCircle,
  Pencil,
  Phone,
  Store,
  Truck,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { colors } from '../../theme/colors';
import { avatarTone, formatPhoneDisplay } from '../../utils/customer';
import { formatCompactNaira, formatNaira } from '../../utils/money';
import { SupplierFormSheet } from './components/SupplierFormSheet';
import { useSupplierDetail } from './hooks/useSupplierDetail';
import type { MoreStackParamList } from '../more/MoreStack';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<MoreStackParamList, 'SupplierDetail'>;

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function toWhatsAppDigits(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

export function SupplierDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { data, loading, refreshing, error, refresh } = useSupplierDetail(
    route.params.supplierId,
  );
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  async function onWhatsApp() {
    const phone = data?.supplier.phone_number;
    if (!phone) {
      Alert.alert('No phone number', 'Add a phone number to message on WhatsApp.');
      return;
    }
    const firstName = data.supplier.name.split(/\s+/)[0] ?? data.supplier.name;
    const message = encodeURIComponent(`Hi ${firstName}, `);
    const url = `https://wa.me/${toWhatsAppDigits(phone)}?text=${message}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp on this device.');
      return;
    }
    await Linking.openURL(url);
  }

  async function onCall() {
    const phone = data?.supplier.phone_number;
    if (!phone) {
      Alert.alert('No phone number', 'Add a phone number to call this supplier.');
      return;
    }
    const url = `tel:${phone.replace(/\s/g, '')}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('Call unavailable', 'Could not start a phone call on this device.');
      return;
    }
    await Linking.openURL(url);
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
          Supplier not found
        </Text>
        {error ? (
          <Text className="mt-2 text-center text-[13px] text-danger">{error}</Text>
        ) : null}
        <Pressable
          className="mt-4 rounded-2xl bg-primary px-4 py-3"
          onPress={() => goBackInStack(navigation, 'SuppliersList')}
        >
          <Text className="text-[14px] font-semibold text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { supplier, restocks, totalSpend, restockCount, lastRestockAt } = data;
  const tone = avatarTone(supplier.name);
  const hash = [...supplier.name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const iconColors = [
    colors.danger,
    colors.accent,
    colors.primary,
    colors.teal,
    '#4338ca',
  ] as const;
  const iconColor = iconColors[hash % iconColors.length];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'SuppliersList')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => setEditOpen(true)}
        >
          <Pencil color={colors.text} size={18} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32 + Math.max(insets.bottom, 8),
        }}
      >
        <View className="mt-1 flex-row items-center gap-3">
          <View
            className={`h-14 w-14 items-center justify-center rounded-2xl ${tone.bg}`}
          >
            <Store color={iconColor} size={24} strokeWidth={1.8} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[22px] font-bold text-text" numberOfLines={2}>
              {supplier.name}
            </Text>
            <Text className="mt-0.5 text-[14px] text-text-muted">
              {formatPhoneDisplay(supplier.phone_number)}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          <MetricCard label="Total spent" value={formatCompactNaira(totalSpend)} />
          <MetricCard label="Restocks" value={String(restockCount)} />
          <MetricCard label="Last" value={formatShortDate(lastRestockAt)} />
        </View>

        <View className="mt-3 flex-row gap-2.5">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 active:opacity-90"
            onPress={() => void onWhatsApp()}
          >
            <MessageCircle color={colors.white} size={18} strokeWidth={2} />
            <Text className="text-[15px] font-semibold text-white">WhatsApp</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-surface py-3.5 active:opacity-90"
            onPress={() => void onCall()}
          >
            <Phone color={colors.primary} size={18} strokeWidth={1.9} />
            <Text className="text-[15px] font-semibold text-primary">Call</Text>
          </Pressable>
        </View>

        {supplier.notes ? (
          <View className="mt-3 flex-row items-start gap-2.5 rounded-[20px] bg-surface px-4 py-3.5">
            <FileText color={colors.textSubtle} size={18} strokeWidth={1.8} />
            <Text className="min-w-0 flex-1 text-[14px] leading-5 text-text-muted">
              {supplier.notes}
            </Text>
          </View>
        ) : null}

        <Text className="mb-3 mt-6 text-[16px] font-bold text-text">
          Restock history
        </Text>

        {restocks.length === 0 ? (
          <View className="rounded-[22px] bg-surface px-4 py-6">
            <Text className="text-[13px] text-text-muted">
              No linked restocks yet. Pick this supplier when you restock a
              product.
            </Text>
          </View>
        ) : (
          <View className="overflow-hidden rounded-[22px] bg-surface">
            {restocks.map((row, index) => (
              <Pressable
                key={row.id}
                onPress={() => {
                  const parent = navigation.getParent();
                  if (!parent) return;
                  pushInTab(
                    parent,
                    'ProductsTab',
                    'ProductsList',
                    'ProductDetail',
                    { productId: row.productId },
                  );
                }}
                className={
                  index < restocks.length - 1
                    ? 'flex-row items-center gap-3 border-b border-text/5 px-4 py-3.5 active:opacity-80'
                    : 'flex-row items-center gap-3 px-4 py-3.5 active:opacity-80'
                }
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-tint">
                  <Truck color={colors.primary} size={18} strokeWidth={1.9} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[15px] font-semibold text-text"
                    numberOfLines={1}
                  >
                    {row.productName} × {row.quantity}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-text-subtle">
                    {formatShortDate(row.createdAt)}
                    {row.unitCost != null
                      ? ` · ${formatNaira(row.unitCost)} each`
                      : ''}
                    {row.note ? ` · ${row.note}` : ''}
                  </Text>
                </View>
                <Text className="text-[14px] font-bold text-text">
                  {row.spend > 0 ? formatNaira(row.spend) : '—'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <SupplierFormSheet
        open={editOpen}
        mode="edit"
        initial={supplier}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          void refresh();
        }}
      />
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[18px] bg-surface px-2.5 py-3">
      <Text className="text-[11px] font-medium text-text-muted">{label}</Text>
      <Text
        className="mt-1 text-[16px] font-bold tracking-tight text-text"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
