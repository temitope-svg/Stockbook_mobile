import { Store, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QtyStepper } from '../../../components/ui/QtyStepper';
import { colors } from '../../../theme/colors';
import { formatNaira } from '../../../utils/money';
import { useSuppliers } from '../hooks/useSuppliers';

export type RestockPayload = {
  quantity: number;
  unitCost: number;
  sellingPrice: number | null;
  supplierId: string | null;
  note: string;
};

type RestockSheetProps = {
  open: boolean;
  productName: string;
  currentQty: number;
  costPrice: number;
  sellingPrice: number;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: RestockPayload) => Promise<void>;
};

export function RestockSheet({
  open,
  productName,
  currentQty,
  costPrice,
  sellingPrice,
  saving,
  onClose,
  onSave,
}: RestockSheetProps) {
  const insets = useSafeAreaInsets();
  const { suppliers } = useSuppliers();
  const [quantity, setQuantity] = useState(1);
  const [unitCostText, setUnitCostText] = useState(String(costPrice));
  const [updateSelling, setUpdateSelling] = useState(false);
  const [sellingText, setSellingText] = useState(String(sellingPrice));
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierOpen, setSupplierOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuantity(50);
    setUnitCostText(String(Math.round(costPrice)));
    setUpdateSelling(false);
    setSellingText(String(Math.round(sellingPrice)));
    setSupplierId(null);
    setSupplierOpen(false);
  }, [open, costPrice, sellingPrice]);

  const unitCost = Number(unitCostText.replace(/,/g, '')) || 0;
  const nextSelling = Number(sellingText.replace(/,/g, '')) || sellingPrice;
  const totalCost = unitCost * quantity;
  const newStock = currentQty + quantity;
  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const canSave = quantity >= 1 && unitCost >= 0 && !saving;

  const summary = useMemo(
    () => ({
      totalCost,
      newStock,
    }),
    [totalCost, newStock],
  );

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[90%] rounded-t-[28px] bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={e => e.stopPropagation()}
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-text/15" />
          </View>

          <View className="flex-row items-start justify-between px-5 pb-2 pt-4">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[20px] font-bold text-text">
                Restock {productName}
              </Text>
              <Text className="mt-1 text-[13px] text-text-muted">
                Currently {currentQty} in stock
              </Text>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          >
            <View className="mt-2 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                  Quantity
                </Text>
                <QtyStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  size="lg"
                  variant="bordered"
                />
              </View>

              <View className="flex-1">
                <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                  Buying price
                </Text>
                <View className="flex-row items-center rounded-2xl border border-text/10 bg-surface px-3 py-3">
                  <Text className="text-[16px] font-semibold text-text">₦</Text>
                  <TextInput
                    value={unitCostText}
                    onChangeText={text =>
                      setUnitCostText(text.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    className="ml-1 flex-1 text-[16px] font-semibold text-text"
                  />
                </View>
              </View>
            </View>

            <View className="mt-4">
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Supplier · optional
              </Text>
              <Pressable
                className="flex-row items-center gap-2 rounded-2xl border border-text/10 bg-surface px-3.5 py-3.5 active:opacity-90"
                onPress={() => setSupplierOpen(openNow => !openNow)}
              >
                <Store color={colors.textSubtle} size={18} strokeWidth={1.8} />
                <Text
                  className={
                    selectedSupplier
                      ? 'flex-1 text-[15px] font-medium text-text'
                      : 'flex-1 text-[15px] text-text-subtle'
                  }
                >
                  {selectedSupplier?.name ?? 'Choose supplier'}
                </Text>
              </Pressable>
              {supplierOpen ? (
                <View className="mt-2 overflow-hidden rounded-2xl bg-surface">
                  <Pressable
                    className="border-b border-text/5 px-4 py-3 active:bg-background"
                    onPress={() => {
                      setSupplierId(null);
                      setSupplierOpen(false);
                    }}
                  >
                    <Text className="text-[14px] text-text-muted">No supplier</Text>
                  </Pressable>
                  {suppliers.map(supplier => (
                    <Pressable
                      key={supplier.id}
                      className="border-b border-text/5 px-4 py-3 active:bg-background"
                      onPress={() => {
                        setSupplierId(supplier.id);
                        setSupplierOpen(false);
                      }}
                    >
                      <Text className="text-[14px] font-medium text-text">
                        {supplier.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-surface px-4 py-3.5">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="text-[15px] font-semibold text-text">
                  Update selling price
                </Text>
                <Text className="mt-0.5 text-[12px] text-text-muted">
                  {updateSelling
                    ? 'Set a new selling price'
                    : `Keep ${formatNaira(sellingPrice)}`}
                </Text>
              </View>
              <Switch
                value={updateSelling}
                onValueChange={setUpdateSelling}
                trackColor={{ false: '#d9d6ce', true: colors.primarySoft }}
                thumbColor={updateSelling ? colors.primary : '#f4f3f0'}
              />
            </View>

            {updateSelling ? (
              <View className="mt-3">
                <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                  Selling price
                </Text>
                <View className="flex-row items-center rounded-2xl border border-text/10 bg-surface px-3 py-3">
                  <Text className="text-[16px] font-semibold text-text">₦</Text>
                  <TextInput
                    value={sellingText}
                    onChangeText={text =>
                      setSellingText(text.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    className="ml-1 flex-1 text-[16px] font-semibold text-text"
                  />
                </View>
              </View>
            ) : null}

            <View className="mt-4 rounded-2xl bg-primary-tint px-4 py-3.5">
              <Text className="text-[14px] font-semibold text-primary">
                Total cost: {formatNaira(summary.totalCost)}
              </Text>
              <Text className="mt-1 text-[13px] text-primary/80">
                New stock level: {summary.newStock} units
              </Text>
            </View>
          </ScrollView>

          <Pressable
            disabled={!canSave}
            className={
              canSave
                ? 'mx-5 mt-3 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90'
                : 'mx-5 mt-3 h-14 items-center justify-center rounded-2xl bg-primary/40'
            }
            onPress={() =>
              void onSave({
                quantity,
                unitCost,
                sellingPrice: updateSelling ? nextSelling : null,
                supplierId,
                note: '',
              })
            }
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="text-[16px] font-semibold text-white">
                Save restock
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
