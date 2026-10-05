import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors } from '../../theme/colors';

type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'> & {
  label: string;
  error?: string;
};

export function PasswordField({
  label,
  error,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="w-full">
      <Text className="mb-2 text-[14px] font-semibold text-text">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl border border-text/10 bg-surface ${
          error ? 'border-danger' : ''
        }`}
      >
        <TextInput
          placeholderTextColor={colors.textSubtle}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          className={`flex-1 px-4 py-3.5 text-[16px] text-text ${className ?? ''}`}
          {...props}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          className="px-3.5 py-3.5 active:opacity-70"
          onPress={() => setVisible(v => !v)}
          hitSlop={8}
        >
          {visible ? (
            <EyeOff color={colors.textSubtle} size={20} strokeWidth={1.8} />
          ) : (
            <Eye color={colors.textSubtle} size={20} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>
      {error ? (
        <Text className="mt-1.5 text-[13px] text-danger">{error}</Text>
      ) : null}
    </View>
  );
}
