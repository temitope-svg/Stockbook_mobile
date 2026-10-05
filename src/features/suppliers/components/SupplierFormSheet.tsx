import { Store, X } from 'lucide-react-native';
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
import { PhoneField } from '../../../components/ui/PhoneField';
import { isValidAfricanPhone } from '../../../lib/phone';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../theme/colors';

type SupplierFormSheetProps = {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: {
    id: string;
    name: string;
    phone_number: string | null;
    notes: string | null;
  } | null;
  onClose: () => void;
  onSaved: (supplierId: string) => void;
};

export function SupplierFormSheet({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: SupplierFormSheetProps) {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPhone(initial?.phone_number ?? '');
    setNotes(initial?.notes ?? '');
  }, [open, initial]);

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert('Name required', 'Enter the supplier’s name.');
      return;
    }
    if (phone && !isValidAfricanPhone(phone)) {
      Alert.alert('Invalid phone', 'Enter a valid phone number.');
      return;
    }
    if (!shopId) return;

    setSaving(true);
    const payload = {
      name: trimmed,
      phone_number: phone || null,
      notes: notes.trim() || null,
    };

    if (mode === 'edit' && initial?.id) {
      const { error } = await supabase
        .from('suppliers')
        .update(payload)
        .eq('id', initial.id)
        .eq('user_id', shopId);
      setSaving(false);
      if (error) {
        Alert.alert("Couldn't save supplier", error.message);
        return;
      }
      onSaved(initial.id);
      onClose();
      return;
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({ user_id: shopId, ...payload })
      .select('id')
      .single();

    setSaving(false);
    if (error || !data) {
      Alert.alert(
        "Couldn't add supplier",
        error?.message?.includes('suppliers') ||
          error?.message?.includes('schema cache')
          ? 'Run stockbook-suppliers-migration.sql in Supabase, then try again.'
          : (error?.message ?? 'Try again.'),
      );
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
              <Store color={colors.primary} size={20} strokeWidth={1.8} />
              <Text className="text-[20px] font-bold text-text">
                {mode === 'edit' ? 'Edit supplier' : 'Add supplier'}
              </Text>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="gap-3 px-5 pt-3">
            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Balogun Market — Tunde"
                placeholderTextColor={colors.textSubtle}
                className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
                autoFocus={mode === 'add'}
              />
            </View>

            <PhoneField value={phone} onChange={setPhone} />

            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Notes (optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="What they supply, delivery days…"
                placeholderTextColor={colors.textSubtle}
                multiline
                textAlignVertical="top"
                className="min-h-[96px] rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
              />
            </View>

            <Pressable
              className="mt-1 h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90"
              onPress={() => void onSave()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
                  {mode === 'edit' ? 'Save changes' : 'Save supplier'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
