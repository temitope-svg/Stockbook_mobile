import {
  Banknote,
  Building2,
  CreditCard,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { syncSaleStatusFromDebt } from '../../../lib/syncSaleStatusFromDebt';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../theme/colors';
import type { PaymentMethod } from '../../../types/domain';
import { formatNaira } from '../../../utils/money';
import { PAYMENT_METHOD_OPTIONS } from '../../../utils/paymentMethod';

export type OpenDebtOption = {
  id: string;
  remaining: number;
  label: string;
};

type RecordPaymentSheetProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  customerName: string;
  amountOwed: number;
  debts: OpenDebtOption[];
};

const METHOD_ICONS = {
  cash: Banknote,
  transfer: Building2,
  pos: CreditCard,
} as const;

export function RecordPaymentSheet({
  open,
  onClose,
  onSaved,
  customerName,
  amountOwed,
  debts,
}: RecordPaymentSheetProps) {
  const insets = useSafeAreaInsets();
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [debtId, setDebtId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDebtId(debts[0]?.id ?? '');
    setAmountText('');
    setMethod('transfer');
  }, [open, debts]);

  const selectedDebt = useMemo(
    () => debts.find(d => d.id === debtId) ?? debts[0],
    [debts, debtId],
  );

  const amount = Number(amountText.replace(/,/g, '')) || 0;
  const remaining = selectedDebt?.remaining ?? amountOwed;
  const balanceAfter = Math.max(0, remaining - amount);

  function setQuickAmount(value: number) {
    setAmountText(String(Math.round(value)));
  }

  async function onSave() {
    if (!selectedDebt) {
      Alert.alert('No debt', 'This customer has no open debt.');
      return;
    }
    if (amount <= 0) {
      Alert.alert('Enter amount', 'Type how much you received.');
      return;
    }
    if (amount > selectedDebt.remaining) {
      Alert.alert(
        'Amount too high',
        `Can't be more than ${formatNaira(selectedDebt.remaining)}.`,
      );
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('payments').insert({
      debt_id: selectedDebt.id,
      amount,
      payment_method: method,
      note: null,
    });

    if (error) {
      setSaving(false);
      Alert.alert("Couldn't save", error.message);
      return;
    }

    await syncSaleStatusFromDebt(selectedDebt.id);
    setSaving(false);
    onSaved();
    onClose();
    Alert.alert('Payment recorded', `${formatNaira(amount)} received.`);
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="rounded-t-[28px] bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={e => e.stopPropagation()}
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-text/15" />
          </View>

          <View className="flex-row items-start justify-between px-5 pb-2 pt-4">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[20px] font-bold text-text">
                Record payment
              </Text>
              <Text className="mt-1 text-[13px] text-text-muted">
                {customerName} · currently owes{' '}
                <Text className="font-semibold text-danger">
                  {formatNaira(amountOwed)}
                </Text>
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="mx-5 mt-3 rounded-[22px] bg-surface px-4 py-5">
            <Text className="text-center text-[12px] font-medium text-text-muted">
              Amount received
            </Text>
            <View className="mt-2 flex-row items-center justify-center">
              <Text className="text-[34px] font-bold text-text">₦</Text>
              <TextInput
                value={amountText}
                onChangeText={text =>
                  setAmountText(text.replace(/[^0-9]/g, ''))
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSubtle}
                className="min-w-[120px] text-center text-[34px] font-bold text-text"
              />
            </View>
          </View>

          <View className="mt-3 flex-row gap-2 px-5">
            <Pressable
              className="rounded-full border border-primary bg-primary-tint px-3.5 py-2 active:opacity-80"
              onPress={() => setQuickAmount(remaining)}
            >
              <Text className="text-[13px] font-semibold text-primary">
                Pay in full
              </Text>
            </Pressable>
            <Pressable
              className="rounded-full border border-text/10 bg-surface px-3.5 py-2 active:opacity-80"
              onPress={() => setQuickAmount(remaining / 2)}
            >
              <Text className="text-[13px] font-medium text-text">Half</Text>
            </Pressable>
            {remaining > 100000 ? (
              <Pressable
                className="rounded-full border border-text/10 bg-surface px-3.5 py-2 active:opacity-80"
                onPress={() => setQuickAmount(100000)}
              >
                <Text className="text-[13px] font-medium text-text">
                  ₦100,000
                </Text>
              </Pressable>
            ) : null}
          </View>

          {debts.length > 1 ? (
            <View className="mt-4 px-5">
              <Text className="mb-2 text-[12px] font-medium text-text-muted">
                Apply to debt
              </Text>
              <View className="gap-2">
                {debts.map(debt => {
                  const active = debt.id === selectedDebt?.id;
                  return (
                    <Pressable
                      key={debt.id}
                      onPress={() => setDebtId(debt.id)}
                      className={
                        active
                          ? 'rounded-2xl border border-primary bg-primary-tint px-3.5 py-3'
                          : 'rounded-2xl border border-text/10 bg-surface px-3.5 py-3'
                      }
                    >
                      <Text
                        className={
                          active
                            ? 'text-[14px] font-semibold text-primary'
                            : 'text-[14px] font-medium text-text'
                        }
                        numberOfLines={1}
                      >
                        {debt.label}
                      </Text>
                      <Text className="mt-0.5 text-[12px] text-text-subtle">
                        {formatNaira(debt.remaining)} left
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View className="mt-4 px-5">
            <Text className="mb-2 text-[12px] font-medium text-text-muted">
              Method
            </Text>
            <View className="flex-row gap-2">
              {PAYMENT_METHOD_OPTIONS.map(option => {
                const Icon = METHOD_ICONS[option.value];
                const active = method === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setMethod(option.value)}
                    className={
                      active
                        ? 'flex-1 items-center gap-1.5 rounded-2xl border border-primary bg-primary-tint py-3'
                        : 'flex-1 items-center gap-1.5 rounded-2xl border border-text/10 bg-surface py-3'
                    }
                  >
                    <Icon
                      color={active ? colors.primary : colors.textSubtle}
                      size={18}
                      strokeWidth={1.8}
                    />
                    <Text
                      className={
                        active
                          ? 'text-[13px] font-semibold text-primary'
                          : 'text-[13px] font-medium text-text'
                      }
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mx-5 mt-4 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
            <Text className="text-[13px] text-text-muted">
              Balance after this payment
            </Text>
            <Text className="text-[15px] font-bold text-text">
              {formatNaira(balanceAfter)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            className="mx-5 mt-4 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
            onPress={() => void onSave()}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="text-[16px] font-semibold text-white">
                Save payment
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
