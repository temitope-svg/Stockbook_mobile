import { Pencil, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import { useAuth } from '../../../auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { ProductImageUpload } from '../../../lib/uploadProductImage';
import { uploadCustomerPhoto } from '../../../lib/uploadCustomerPhoto';
import { colors } from '../../../theme/colors';
import type { Customer } from '../../../types/domain';
import { CustomerPhotoField } from './CustomerPhotoField';

type EditCustomerSheetProps = {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditCustomerSheet({
  open,
  customer,
  onClose,
  onSaved,
}: EditCustomerSheetProps) {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<ProductImageUpload | null>(
    null,
  );
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !customer) return;
    setName(customer.name);
    setPhone(customer.phone_number ?? '');
    setPendingPhoto(null);
    setPreviewUri(customer.photo_url ?? null);
    setRemovePhoto(false);
  }, [open, customer]);

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert('Name required', 'Enter at least 2 characters.');
      return;
    }
    if (!shopId || !customer) return;

    setSaving(true);

    let photo_url = removePhoto ? null : (customer.photo_url ?? null);
    if (pendingPhoto) {
      const uploaded = await uploadCustomerPhoto(shopId, pendingPhoto);
      if (!uploaded) {
        setSaving(false);
        Alert.alert(
          'Photo upload failed',
          'You can save without changing the photo, or run stockbook-customer-photos-migration.sql in Supabase and try again.',
          [
            {
              text: 'Save without new photo',
              onPress: () => {
                void saveCustomer(
                  trimmed,
                  removePhoto ? null : (customer.photo_url ?? null),
                );
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
      photo_url = uploaded;
    }

    await saveCustomer(trimmed, photo_url);
  }

  async function saveCustomer(trimmed: string, photo_url: string | null) {
    if (!shopId || !customer) return;
    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({
        name: trimmed,
        phone_number: phone.trim() || null,
        photo_url,
      })
      .eq('id', customer.id)
      .eq('user_id', shopId);

    setSaving(false);
    if (error) {
      Alert.alert(
        "Couldn't save",
        error.message.includes('photo_url')
          ? 'Customer photos need photo_url on customers — run stockbook-customer-photos-migration.sql.'
          : error.message,
      );
      return;
    }

    onSaved();
    onClose();
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

          <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
            <View className="flex-row items-center gap-2">
              <Pencil color={colors.primary} size={20} strokeWidth={1.8} />
              <Text className="text-[20px] font-bold text-text">Edit customer</Text>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="gap-3 px-5 pt-3">
            <CustomerPhotoField
              previewUri={previewUri}
              onPicked={(image, uri) => {
                setPendingPhoto(image);
                setPreviewUri(uri);
                setRemovePhoto(false);
              }}
              onCleared={() => {
                setPendingPhoto(null);
                setPreviewUri(null);
                setRemovePhoto(true);
              }}
            />
            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Customer name"
                placeholderTextColor={colors.textSubtle}
                className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
                autoFocus
              />
            </View>
            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Phone (optional)
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="0801 234 5678"
                placeholderTextColor={colors.textSubtle}
                keyboardType="phone-pad"
                className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
              />
            </View>
          </View>

          <Pressable
            disabled={saving}
            className="mx-5 mt-5 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
            onPress={() => void onSave()}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="text-[16px] font-semibold text-white">
                Save changes
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
