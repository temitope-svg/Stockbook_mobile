import { Image, Text, View } from 'react-native';
import { avatarTone } from '../../../utils/customer';
import { initials } from '../../../utils/initials';

type CustomerAvatarProps = {
  name: string;
  photoUrl?: string | null;
  overdue?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
} as const;

const TEXT = {
  sm: 'text-[11px]',
  md: 'text-[13px]',
  lg: 'text-[16px]',
} as const;

export function CustomerAvatar({
  name,
  photoUrl,
  overdue = false,
  size = 'md',
}: CustomerAvatarProps) {
  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        className={`${SIZES[size]} rounded-full bg-background`}
        resizeMode="cover"
      />
    );
  }

  const tone = avatarTone(name, overdue);
  return (
    <View
      className={`${SIZES[size]} items-center justify-center rounded-full ${tone.bg}`}
    >
      <Text className={`${TEXT[size]} font-bold ${tone.text}`}>
        {initials(name)}
      </Text>
    </View>
  );
}
