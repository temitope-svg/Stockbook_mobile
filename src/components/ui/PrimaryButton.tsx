import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import { colors } from '../../theme/colors';

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'accent' | 'secondary';
};

export function PrimaryButton({
  label,
  loading,
  disabled,
  variant = 'primary',
  className,
  ...props
}: PrimaryButtonProps) {
  const tone =
    variant === 'accent'
      ? 'bg-accent'
      : variant === 'secondary'
        ? 'bg-primary-soft'
        : 'bg-primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`items-center rounded-2xl py-4 active:opacity-90 ${tone} ${
        disabled || loading ? 'opacity-50' : ''
      } ${className ?? ''}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text className="text-[16px] font-semibold text-white">{label}</Text>
      )}
    </Pressable>
  );
}
