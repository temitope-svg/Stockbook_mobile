import { Search, UserPlus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import type { Customer } from '../../../types/domain';

type CustomerPickerSheetProps = {
  open: boolean;
  customers: Customer[];
  selectedId: string;
  allowWalkIn: boolean;
  onClose: () => void;
  onSelect: (customerId: string) => void;
  onAddNew: () => void;
};

export function CustomerPickerSheet({
  open,
  customers,
  selectedId,
  allowWalkIn,
  onClose,
  onSelect,
  onAddNew,
}: CustomerPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => {
      const hay = [c.name, c.phone_number].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [customers, search]);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[85%] rounded-t-[28px] bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          onPress={e => e.stopPropagation()}
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-text/15" />
          </View>

          <View className="flex-row items-start justify-between px-5 pb-2 pt-4">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[20px] font-bold text-text">Customer</Text>
              <Text className="mt-1 text-[13px] text-text-muted">
                {allowWalkIn
                  ? 'Optional for paid sales'
                  : 'Required for credit or partial'}
              </Text>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="mx-5 mb-3 flex-row items-center rounded-full bg-surface px-4 py-3">
            <Search color={colors.textSubtle} size={18} strokeWidth={1.8} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search customers…"
              placeholderTextColor={colors.textSubtle}
              className="ml-2.5 flex-1 text-[15px] text-text"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable
            onPress={() => {
              onClose();
              onAddNew();
            }}
            className="mx-5 mb-3 flex-row items-center gap-2 rounded-2xl bg-primary-tint px-4 py-3 active:opacity-80"
          >
            <UserPlus color={colors.primary} size={18} strokeWidth={1.9} />
            <Text className="text-[14px] font-semibold text-primary">
              New customer
            </Text>
          </Pressable>

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
            ListHeaderComponent={
              allowWalkIn ? (
                <Pressable
                  onPress={() => {
                    onSelect('');
                    onClose();
                  }}
                  className={
                    selectedId === ''
                      ? 'mb-2 rounded-2xl border border-primary bg-primary-tint px-3.5 py-3.5'
                      : 'mb-2 rounded-2xl bg-surface px-3.5 py-3.5 active:opacity-80'
                  }
                >
                  <Text className="text-[15px] font-semibold text-text">
                    Walk-in / no customer
                  </Text>
                </Pressable>
              ) : (
                <View />
              )
            }
            ListEmptyComponent={
              <View className="items-center py-8">
                <Text className="text-[14px] font-medium text-text-muted">
                  No matching customers
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const active = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className={
                    active
                      ? 'mb-2 rounded-2xl border border-primary bg-primary-tint px-3.5 py-3.5'
                      : 'mb-2 rounded-2xl bg-surface px-3.5 py-3.5 active:opacity-80'
                  }
                >
                  <Text className="text-[15px] font-semibold text-text">
                    {item.name}
                  </Text>
                  {item.phone_number ? (
                    <Text className="mt-0.5 text-[12px] text-text-subtle">
                      {item.phone_number}
                    </Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
