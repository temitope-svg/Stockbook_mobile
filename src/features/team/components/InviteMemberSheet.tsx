import { Check, Circle, Send, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  capabilitiesFor,
  roleShortDescription,
  type InviteRole,
} from '../../auth/inviteRole';
import { colors } from '../../../theme/colors';
import { inviteUrl } from '../hooks/useTeam';

type InviteMemberSheetProps = {
  open: boolean;
  shopName: string;
  onClose: () => void;
  onInvite: (email: string, role: InviteRole) => Promise<{ token: string }>;
};

export function InviteMemberSheet({
  open,
  shopName,
  onClose,
  onInvite,
}: InviteMemberSheetProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('cashier');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setRole('cashier');
  }, [open]);

  async function onSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Email required', 'Enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      const result = await onInvite(trimmed, role);
      const url = inviteUrl(result.token);
      onClose();
      await Share.share({
        message: `Join ${shopName} on StockBook: ${url}`,
        url,
      });
    } catch (e) {
      Alert.alert(
        "Couldn't send invite",
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  const caps = capabilitiesFor(role);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[92%] rounded-t-[28px] bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={e => e.stopPropagation()}
        >
          <View className="items-center pt-3">
            <View className="h-1.5 w-10 rounded-full bg-text/15" />
          </View>

          <View className="flex-row items-start justify-between px-5 pb-2 pt-4">
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-[20px] font-bold text-text">
                Invite a team member
              </Text>
              <Text className="mt-1 text-[13px] text-text-muted">
                They'll get a link by email to join {shopName}.
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
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-text/10 bg-surface px-4 py-3.5 text-[15px] text-text"
              />
            </View>

            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Role
              </Text>
              <View className="gap-2.5">
                {(['manager', 'cashier'] as const).map(option => {
                  const selected = role === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setRole(option)}
                      className={
                        selected
                          ? 'rounded-2xl border border-primary bg-primary-tint px-4 py-3.5'
                          : 'rounded-2xl border border-text/10 bg-surface px-4 py-3.5'
                      }
                    >
                      <View className="flex-row items-start gap-3">
                        <View className="mt-0.5">
                          {selected ? (
                            <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check color={colors.white} size={12} strokeWidth={3} />
                            </View>
                          ) : (
                            <Circle
                              color={colors.textSubtle}
                              size={20}
                              strokeWidth={1.6}
                            />
                          )}
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text
                            className={
                              selected
                                ? 'text-[15px] font-bold text-primary'
                                : 'text-[15px] font-bold text-text'
                            }
                          >
                            {option === 'manager' ? 'Manager' : 'Cashier'}
                          </Text>
                          <Text
                            className={
                              selected
                                ? 'mt-0.5 text-[13px] text-primary/80'
                                : 'mt-0.5 text-[13px] text-text-muted'
                            }
                          >
                            {roleShortDescription(option)}
                          </Text>
                          {selected ? (
                            <View className="mt-2.5 gap-1.5">
                              {caps.items.map(item => (
                                <View
                                  key={item.label}
                                  className="flex-row items-center gap-2"
                                >
                                  {item.allowed ? (
                                    <Check
                                      color={colors.primary}
                                      size={14}
                                      strokeWidth={2.4}
                                    />
                                  ) : (
                                    <X
                                      color={colors.textSubtle}
                                      size={14}
                                      strokeWidth={2.2}
                                    />
                                  )}
                                  <Text
                                    className={
                                      item.allowed
                                        ? 'flex-1 text-[12px] text-primary'
                                        : 'flex-1 text-[12px] text-text-subtle'
                                    }
                                  >
                                    {item.label}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
              onPress={() => void onSend()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Send color={colors.white} size={16} strokeWidth={2.2} />
                  <Text className="text-[15px] font-semibold text-white">
                    Send invite
                  </Text>
                </>
              )}
            </Pressable>
            <Text className="text-center text-[12px] text-text-subtle">
              The link only works for this email address.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
