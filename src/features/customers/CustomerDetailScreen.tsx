import {
  ArrowLeft,
  Banknote,
  Check,
  Clock,
  MessageCircle,
  Pencil,
  Plus,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { permissionsFor } from '../../auth/permissions';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../theme/colors';
import {
  DEFAULT_DEBT_REMINDER_DAYS,
  daysSince,
  formatLastVisitShort,
  formatPhoneDisplay,
  isDebtOverdue,
} from '../../utils/customer';
import { formatCompactNaira, formatNaira } from '../../utils/money';
import { paymentMethodLabel } from '../../utils/paymentMethod';
import { CustomerAvatar } from './components/CustomerAvatar';
import { EditCustomerSheet } from './components/EditCustomerSheet';
import {
  RecordPaymentSheet,
  type OpenDebtOption,
} from './components/RecordPaymentSheet';
import { useCustomerDetail } from './hooks/useCustomerDetail';
import type { CustomersStackParamList } from './CustomersStack';
import { goBackInStack, pushInTab } from '../../navigation/pushInTab';
import { TAB_BAR_STYLE } from '../app/tabBarTheme';


type Props = NativeStackScreenProps<CustomersStackParamList, 'CustomerDetail'>;

type DetailTab = 'debts' | 'purchases' | 'payments';

function formatSoldOn(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function CustomerDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, role } = useAuth();
  const permissions = permissionsFor(role);
  const reminderDays =
    profile?.debt_reminder_days ?? DEFAULT_DEBT_REMINDER_DAYS;
  const { data, loading, error, refresh } = useCustomerDetail(
    route.params.customerId,
  );
  const [tab, setTab] = useState<DetailTab>('debts');
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    };
  }, [navigation]);

  const openDebts = useMemo(() => {
    if (!data) return [] as OpenDebtOption[];
    return data.debts
      .filter(d => d.status === 'open')
      .map(d => ({
        id: d.id,
        remaining: Math.max(0, d.amount_owed - d.amount_paid),
        label: d.summary,
      }))
      .filter(d => d.remaining > 0);
  }, [data]);

  const debtDays =
    data && data.amountOwed > 0
      ? (() => {
          const oldest = data.debts
            .filter(d => d.status === 'open')
            .map(d => d.created_at)
            .sort()
            .at(0);
          return oldest ? daysSince(oldest) : null;
        })()
      : null;

  const overdue =
    debtDays !== null &&
    !!data &&
    data.amountOwed > 0 &&
    isDebtOverdue(debtDays, reminderDays);

  async function onRemind() {
    if (!data?.customer.phone_number) {
      Alert.alert('No phone number', 'Add a phone number to send a reminder.');
      return;
    }
    const digits = data.customer.phone_number.replace(/\D/g, '');
    const local = digits.startsWith('234')
      ? digits
      : digits.startsWith('0')
        ? `234${digits.slice(1)}`
        : digits;
    const message = encodeURIComponent(
      `Hi ${data.customer.name}, friendly reminder from ${profile?.shop_name ?? 'us'}: you currently owe ${formatNaira(data.amountOwed)}. Thank you!`,
    );
    const url = `https://wa.me/${local}?text=${message}`;
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp on this device.');
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
          Customer not found
        </Text>
        {error ? (
          <Text className="mt-2 text-center text-[13px] text-danger">{error}</Text>
        ) : null}
        <Pressable
          className="mt-4"
          onPress={() => goBackInStack(navigation, 'CustomersList')}
        >
          <Text className="text-[14px] font-semibold text-primary">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { customer } = data;
  const tabs: { value: DetailTab; label: string }[] = [
    { value: 'debts', label: 'Debts' },
    { value: 'purchases', label: 'Purchases' },
    { value: 'payments', label: 'Payments' },
  ];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => goBackInStack(navigation, 'CustomersList')}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={1.8} />
        </Pressable>
        {permissions.canEditCustomers ? (
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-80"
            onPress={() => setEditOpen(true)}
          >
            <Pencil color={colors.text} size={18} strokeWidth={1.8} />
          </Pressable>
        ) : (
          <View className="h-11 w-11" />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 28 + Math.max(insets.bottom, 8),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-1 flex-row items-center gap-3.5">
          <CustomerAvatar
            name={customer.name}
            photoUrl={customer.photo_url}
            overdue={overdue}
            size="lg"
          />
          <View className="min-w-0 flex-1">
            <Text className="text-[24px] font-bold text-text" numberOfLines={1}>
              {customer.name}
            </Text>
            <Text className="mt-1 text-[14px] text-text-muted">
              {formatPhoneDisplay(customer.phone_number)}
            </Text>
          </View>
        </View>

        {data.amountOwed > 0 ? (
          <View className="mt-4 rounded-[22px] bg-danger-tint/80 px-4 py-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-medium text-text-muted">
                Owes you
              </Text>
              {overdue && debtDays !== null ? (
                <View className="flex-row items-center gap-1 rounded-full bg-white/70 px-2.5 py-1">
                  <Clock color={colors.danger} size={12} strokeWidth={2} />
                  <Text className="text-[11px] font-semibold text-danger">
                    {debtDays} day{debtDays === 1 ? '' : 's'} overdue
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-2 text-[32px] font-bold tracking-tight text-danger">
              {formatNaira(data.amountOwed)}
            </Text>
          </View>
        ) : (
          <View className="mt-4 rounded-[22px] bg-primary-tint px-4 py-4">
            <View className="flex-row items-center gap-2">
              <Check color={colors.primary} size={16} strokeWidth={2.4} />
              <Text className="text-[15px] font-semibold text-primary">
                All paid up
              </Text>
            </View>
          </View>
        )}

        <View className="mt-3 flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-accent active:opacity-90"
            onPress={() => {
              const parent = navigation.getParent();
              if (!parent) return;
              pushInTab(parent, 'SalesTab', 'SalesList', 'RecordSale', {
                customerId: customer.id,
              });
            }}
          >
            <Plus color={colors.white} size={18} strokeWidth={2.2} />
            <Text className="text-[14px] font-semibold text-white">
              Record sale
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={openDebts.length === 0}
            className={
              openDebts.length === 0
                ? 'h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary/40'
                : 'h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90'
            }
            onPress={() => setPayOpen(true)}
          >
            <Banknote color={colors.white} size={18} strokeWidth={1.8} />
            <Text className="text-[14px] font-semibold text-white">
              Payment
            </Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          className="mt-2.5 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-text/10 bg-surface active:opacity-90"
          onPress={() => void onRemind()}
        >
          <MessageCircle color={colors.text} size={18} strokeWidth={1.8} />
          <Text className="text-[14px] font-semibold text-text">
            Remind on WhatsApp
          </Text>
        </Pressable>

        <View className="mt-3 flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
            <Text className="text-[11px] text-text-subtle">Total spent</Text>
            <Text className="mt-1 text-[16px] font-bold text-text">
              {formatCompactNaira(data.lifetimeSpend)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
            <Text className="text-[11px] text-text-subtle">Visits</Text>
            <Text className="mt-1 text-[16px] font-bold text-text">
              {data.visitCount}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-surface px-3 py-3">
            <Text className="text-[11px] text-text-subtle">Last visit</Text>
            <Text className="mt-1 text-[16px] font-bold text-text">
              {formatLastVisitShort(data.lastPurchaseAt)}
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row gap-2">
          {tabs.map(item => {
            const active = tab === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setTab(item.value)}
                className={
                  active
                    ? 'flex-1 items-center rounded-full bg-primary py-2.5'
                    : 'flex-1 items-center rounded-full py-2.5'
                }
              >
                <Text
                  className={
                    active
                      ? 'text-[13px] font-semibold text-white'
                      : 'text-[13px] font-medium text-text-muted'
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4 gap-2">
          {tab === 'debts'
            ? data.debts.filter(d => d.status === 'open').length === 0
              ? (
                  <Text className="py-8 text-center text-[14px] text-text-muted">
                    No open debts
                  </Text>
                )
              : data.debts
                  .filter(d => d.status === 'open')
                  .map(debt => {
                    const remaining = Math.max(
                      0,
                      debt.amount_owed - debt.amount_paid,
                    );
                    const progress =
                      debt.amount_owed > 0
                        ? Math.min(1, debt.amount_paid / debt.amount_owed)
                        : 0;
                    return (
                      <View
                        key={debt.id}
                        className="rounded-2xl bg-surface px-4 py-3.5"
                      >
                        <View className="flex-row items-start justify-between gap-3">
                          <Text
                            className="min-w-0 flex-1 text-[15px] font-semibold text-text"
                            numberOfLines={1}
                          >
                            {debt.summary}
                          </Text>
                          <View className="rounded-full bg-danger-tint px-2.5 py-1">
                            <Text className="text-[11px] font-semibold text-danger">
                              Open
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-1 text-[12px] text-text-subtle">
                          Sold on {formatSoldOn(debt.when)}
                        </Text>
                        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
                          <View
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </View>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-[12px] text-text-muted">
                            Paid {formatNaira(debt.amount_paid)}
                          </Text>
                          <Text className="text-[12px] font-semibold text-text">
                            of {formatNaira(debt.amount_owed)}
                          </Text>
                        </View>
                        {remaining > 0 ? (
                          <Text className="mt-1 text-[11px] text-text-subtle">
                            {formatNaira(remaining)} left
                          </Text>
                        ) : null}
                      </View>
                    );
                  })
            : null}

          {tab === 'purchases'
            ? data.sales.length === 0
              ? (
                  <Text className="py-8 text-center text-[14px] text-text-muted">
                    No purchases yet
                  </Text>
                )
              : data.sales.map(sale => (
                  <Pressable
                    key={sale.id}
                    className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5 active:opacity-90"
                    onPress={() => {
                      const parent = navigation.getParent();
                      if (!parent) return;
                      pushInTab(parent, 'SalesTab', 'SalesList', 'SaleDetail', {
                        saleId: sale.id,
                      });
                    }}
                  >
                    <View className="min-w-0 flex-1 pr-3">
                      <Text
                        className="text-[15px] font-semibold text-text"
                        numberOfLines={1}
                      >
                        {sale.summary}
                      </Text>
                      <Text className="mt-1 text-[12px] text-text-subtle">
                        {formatSoldOn(sale.created_at)}
                      </Text>
                    </View>
                    <Text className="text-[15px] font-bold text-text">
                      {formatNaira(sale.total_amount)}
                    </Text>
                  </Pressable>
                ))
            : null}

          {tab === 'payments'
            ? data.payments.length === 0
              ? (
                  <Text className="py-8 text-center text-[14px] text-text-muted">
                    No payments yet
                  </Text>
                )
              : data.payments.map(payment => (
                  <View
                    key={payment.id}
                    className="flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5"
                  >
                    <View className="min-w-0 flex-1 pr-3">
                      <Text className="text-[15px] font-semibold text-text">
                        {formatNaira(payment.amount)}
                      </Text>
                      <Text className="mt-1 text-[12px] text-text-subtle">
                        {formatSoldOn(payment.paid_at)}
                        {paymentMethodLabel(payment.payment_method)
                          ? ` · ${paymentMethodLabel(payment.payment_method)}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                ))
            : null}
        </View>
      </ScrollView>

      <RecordPaymentSheet
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onSaved={() => void refresh()}
        customerName={customer.name}
        amountOwed={data.amountOwed}
        debts={openDebts}
      />

      <EditCustomerSheet
        open={editOpen}
        customer={customer}
        onClose={() => setEditOpen(false)}
        onSaved={() => void refresh()}
      />
    </View>
  );
}
