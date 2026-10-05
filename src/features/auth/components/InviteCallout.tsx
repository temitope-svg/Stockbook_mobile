import { Mail } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

export function InviteCallout() {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-accent-tint px-4 py-3.5">
      <View className="mt-0.5">
        <Mail color={colors.accent} size={18} strokeWidth={1.8} />
      </View>
      <Text className="flex-1 text-[13px] leading-relaxed text-accent">
        Invited by your shop owner? Check your email for an invite link instead
        of signing up here.
      </Text>
    </View>
  );
}
