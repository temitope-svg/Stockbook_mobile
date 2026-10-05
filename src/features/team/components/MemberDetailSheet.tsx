import { UserMinus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { InviteRole } from '../../auth/inviteRole';
import { colors } from '../../../theme/colors';
import { avatarTone, daysSince } from '../../../utils/customer';
import { initials } from '../../../utils/initials';
import type { TeamMember } from '../types';

type MemberDetailSheetProps = {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onSave: (memberId: string, role: InviteRole) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
};

function lastActiveLabel(iso: string | null) {
  if (!iso) return '—';
  const days = daysSince(iso);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function MemberDetailSheet({
  open,
  member,
  onClose,
  onSave,
  onRemove,
}: MemberDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<InviteRole>('cashier');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !member) return;
    setRole(member.role === 'manager' ? 'manager' : 'cashier');
  }, [open, member]);

  if (!member) return null;

  const current = member;
  const name = current.display_name?.trim() || 'Teammate';
  const firstName = name.split(/\s+/)[0] ?? name;
  const tone = avatarTone(name);
  const dirty = role !== (current.role === 'manager' ? 'manager' : 'cashier');

  async function save() {
    setSaving(true);
    try {
      await onSave(current.id, role);
      onClose();
    } catch (e) {
      Alert.alert(
        "Couldn't update",
        e instanceof Error ? e.message : 'Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove() {
    Alert.alert(
      'Remove from shop?',
      `${firstName} loses access right away. Past sales stay on record.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                await onRemove(current.id);
                onClose();
              } catch (e) {
                Alert.alert(
                  "Couldn't remove",
                  e instanceof Error ? e.message : 'Try again.',
                );
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
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
            <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${tone.bg}`}
              >
                <Text className={`text-[15px] font-bold ${tone.text}`}>
                  {initials(name)}
                </Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[18px] font-bold text-text" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="mt-0.5 text-[13px] text-text-muted">
                  {current.role === 'manager' ? 'Manager' : 'Cashier'}
                </Text>
              </View>
            </View>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="gap-4 px-5 pt-2">
            <View className="flex-row gap-2.5">
              <View className="flex-1 rounded-[18px] bg-surface px-3.5 py-3.5">
                <Text className="text-[12px] font-medium text-text-muted">
                  Sales this week
                </Text>
                <Text className="mt-1 text-[22px] font-bold text-text">
                  {current.salesThisWeek}
                </Text>
              </View>
              <View className="flex-1 rounded-[18px] bg-surface px-3.5 py-3.5">
                <Text className="text-[12px] font-medium text-text-muted">
                  Last active
                </Text>
                <Text className="mt-1 text-[22px] font-bold text-text">
                  {lastActiveLabel(current.lastActiveAt)}
                </Text>
              </View>
            </View>

            <View>
              <Text className="mb-1.5 text-[12px] font-medium text-text-muted">
                Role
              </Text>
              <View className="flex-row rounded-2xl bg-surface p-1">
                {(['manager', 'cashier'] as const).map(option => {
                  const selected = role === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setRole(option)}
                      className={
                        selected
                          ? 'flex-1 items-center rounded-xl bg-primary py-3'
                          : 'flex-1 items-center rounded-xl py-3'
                      }
                    >
                      <Text
                        className={
                          selected
                            ? 'text-[14px] font-semibold text-white'
                            : 'text-[14px] font-medium text-text-muted'
                        }
                      >
                        {option === 'manager' ? 'Manager' : 'Cashier'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="mt-2 text-[12px] text-text-subtle">
                Changes apply the next time {firstName} opens the app.
              </Text>
            </View>

            <Pressable
              onPress={confirmRemove}
              className="flex-row items-start gap-3 rounded-2xl bg-danger-tint px-4 py-3.5 active:opacity-90"
            >
              <UserMinus color={colors.danger} size={20} strokeWidth={1.9} />
              <View className="min-w-0 flex-1">
                <Text className="text-[15px] font-semibold text-danger">
                  Remove from shop
                </Text>
                <Text className="mt-0.5 text-[12px] leading-5 text-danger/80">
                  {firstName} loses access right away. Past sales stay on
                  record.
                </Text>
              </View>
            </Pressable>

            <Pressable
              className={
                dirty
                  ? 'h-12 items-center justify-center rounded-2xl bg-primary active:opacity-90'
                  : 'h-12 items-center justify-center rounded-2xl bg-primary/40'
              }
              disabled={!dirty || saving}
              onPress={() => void save()}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
                  Save changes
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
