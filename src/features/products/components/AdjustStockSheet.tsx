import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';

export const ADJUST_REASONS = [
  { value: 'damaged', label: 'Damaged / spoilt' },
  { value: 'missing', label: 'Missing / stolen' },
  { value: 'recount', label: 'Count correction' },
  { value: 'other', label: 'Other' },
] as const;

export type AdjustReason = (typeof ADJUST_REASONS)[number]['value'];

export function adjustReasonLabel(reason: AdjustReason): string {
  return ADJUST_REASONS.find(r => r.value === reason)?.label ?? 'Adjusted';
}

type AdjustStockSheetProps = {
  open: boolean;
  currentQuantity: number;
  saving: boolean;
  onClose: () => void;
  onSave: (nextQuantity: number, reason: AdjustReason, note: string) => Promise<void>;
};

export function AdjustStockSheet({
  open,
  currentQuantity,
  saving,
  onClose,
  onSave,
}: AdjustStockSheetProps) {
  const insets = useSafeAreaInsets();
  const [quantityText, setQuantityText] = useState(String(currentQuantity));
  const [reason, setReason] = useState<AdjustReason>('recount');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuantityText(String(currentQuantity));
    setReason('recount');
    setNote('');
  }, [open, currentQuantity]);

  const nextQuantity = Number(quantityText) || 0;
  const delta = nextQuantity - currentQuantity;

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
              <Text className="text-[20px] font-bold text-text">Adjust stock</Text>
              <Text className="mt-1 text-[13px] text-text-muted">
                Now showing {currentQuantity} in stock
              </Text>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="gap-4 px-5 pt-2">
            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Correct quantity
              </Text>
              <TextInput
                value={quantityText}
                onChangeText={text => setQuantityText(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[16px] font-semibold text-text"
              />
              <Text className="mt-1.5 text-[12px] text-text-subtle">
                {delta === 0
                  ? 'No change yet'
                  : delta > 0
                    ? `Will add ${delta}`
                    : `Will remove ${Math.abs(delta)}`}
              </Text>
            </View>

            <View>
              <Text className="mb-2 text-[12px] font-medium text-text-muted">
                Reason
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ADJUST_REASONS.map(option => {
                  const active = reason === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setReason(option.value)}
                      className={
                        active
                          ? 'rounded-full bg-primary px-3.5 py-2'
                          : 'rounded-full border border-text/10 bg-surface px-3.5 py-2'
                      }
                    >
                      <Text
                        className={
                          active
                            ? 'text-[13px] font-semibold text-white'
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

            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Note (optional)
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Extra detail"
                placeholderTextColor={colors.textSubtle}
                className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
              />
            </View>
          </View>

          <Pressable
            disabled={saving || delta === 0 || nextQuantity < 0}
            className={
              saving || delta === 0 || nextQuantity < 0
                ? 'mx-5 mt-5 h-14 items-center justify-center rounded-2xl bg-primary/40'
                : 'mx-5 mt-5 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90'
            }
            onPress={() => void onSave(nextQuantity, reason, note.trim())}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="text-[16px] font-semibold text-white">
                Save adjustment
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
