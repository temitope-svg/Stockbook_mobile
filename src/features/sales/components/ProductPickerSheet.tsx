import { Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import type { Product } from '../../../types/domain';
import { formatNaira } from '../../../utils/money';

type ProductPickerSheetProps = {
  open: boolean;
  products: Product[];
  remainingStock: (productId: string) => number;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (productId: string) => void;
};

export function ProductPickerSheet({
  open,
  products,
  remainingStock,
  selectedId,
  onClose,
  onSelect,
}: ProductPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => {
      const hay = [p.name, p.category, p.variant, p.imei]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [products, search]);

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
              <Text className="text-[20px] font-bold text-text">Choose product</Text>
              <Text className="mt-1 text-[13px] text-text-muted">
                Out-of-stock items are disabled
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
              placeholder="Search products…"
              placeholderTextColor={colors.textSubtle}
              className="ml-2.5 flex-1 text-[15px] text-text"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-[14px] font-medium text-text-muted">
                  No matching products
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const left = remainingStock(item.id);
              const disabled = left <= 0;
              const active = item.id === selectedId;
              return (
                <Pressable
                  disabled={disabled}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className={
                    active
                      ? 'mb-2 flex-row items-center gap-3 rounded-2xl border border-primary bg-primary-tint px-3.5 py-3'
                      : disabled
                        ? 'mb-2 flex-row items-center gap-3 rounded-2xl bg-surface/60 px-3.5 py-3 opacity-50'
                        : 'mb-2 flex-row items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 active:opacity-80'
                  }
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      className="h-11 w-11 rounded-xl bg-background"
                    />
                  ) : (
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-tint">
                      <Text className="text-[13px] font-bold text-primary">
                        {item.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="min-w-0 flex-1">
                    <Text
                      className="text-[15px] font-semibold text-text"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-text-subtle">
                      {formatNaira(item.selling_price)}
                      {' · '}
                      {disabled ? 'Out of stock' : `${left} left`}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
