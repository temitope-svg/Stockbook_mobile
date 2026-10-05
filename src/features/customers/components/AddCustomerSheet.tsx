import { UserPlus, X } from 'lucide-react-native';
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
import { CustomerPhotoField } from './CustomerPhotoField';

type AddCustomerSheetProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (customerId: string) => void;
};

export function AddCustomerSheet({
  open,
  onClose,
  onSaved,
}: AddCustomerSheetProps) {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<ProductImageUpload | null>(
    null,
  );
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setPhone('');
    setPendingPhoto(null);
    setPreviewUri(null);
  }, [open]);

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter the customer’s name.');
      return;
    }
    if (!shopId) return;

    setSaving(true);

    let photo_url: string | null = null;
    if (pendingPhoto) {
      const uploaded = await uploadCustomerPhoto(shopId, pendingPhoto);
      if (!uploaded) {
        setSaving(false);
        Alert.alert(
          'Photo upload failed',
          'You can save without a photo, or run stockbook-customer-photos-migration.sql in Supabase and try again.',
          [
            {
              text: 'Save without photo',
              onPress: () => {
                void saveCustomer(trimmed, null);
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
    if (!shopId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: shopId,
        name: trimmed,
        phone_number: phone.trim() || null,
        photo_url,
      })
      .select('id')
      .single();

    setSaving(false);
    if (error || !data) {
      Alert.alert("Couldn't add customer", error?.message ?? 'Try again.');
      return;
    }

    onSaved(data.id);
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
              <UserPlus color={colors.primary} size={20} strokeWidth={1.8} />
              <Text className="text-[20px] font-bold text-text">Add customer</Text>
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
              }}
              onCleared={() => {
                setPendingPhoto(null);
                setPreviewUri(null);
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
                Save customer
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
