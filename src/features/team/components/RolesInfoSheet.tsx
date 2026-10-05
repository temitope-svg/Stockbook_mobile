import { Check, X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { capabilitiesFor, type InviteRole } from '../../auth/inviteRole';
import { colors } from '../../../theme/colors';

type RolesInfoSheetProps = {
  open: boolean;
  onClose: () => void;
};

function RoleBlock({ role }: { role: InviteRole }) {
  const caps = capabilitiesFor(role);
  return (
    <View className="rounded-2xl bg-surface px-4 py-4">
      <Text className="text-[16px] font-bold text-text">
        {role === 'manager' ? 'Manager' : 'Cashier'}
      </Text>
      <View className="mt-3 gap-2">
        {caps.items.map(item => (
          <View key={item.label} className="flex-row items-start gap-2">
            {item.allowed ? (
              <Check color={colors.primary} size={16} strokeWidth={2.3} />
            ) : (
              <X color={colors.textSubtle} size={16} strokeWidth={2.2} />
            )}
            <Text
              className={
                item.allowed
                  ? 'flex-1 text-[13px] text-text'
                  : 'flex-1 text-[13px] text-text-subtle'
              }
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function RolesInfoSheet({ open, onClose }: RolesInfoSheetProps) {
  const insets = useSafeAreaInsets();

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
            <Text className="text-[20px] font-bold text-text">
              What can each role do?
            </Text>
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-full bg-surface active:opacity-80"
              onPress={onClose}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View className="gap-3 px-5 pt-2">
            <View className="rounded-2xl bg-surface px-4 py-4">
              <Text className="text-[16px] font-bold text-text">Owner</Text>
              <Text className="mt-2 text-[13px] leading-5 text-text-muted">
                Full access — including team invites, roles, and shop settings.
              </Text>
            </View>
            <RoleBlock role="manager" />
            <RoleBlock role="cashier" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
