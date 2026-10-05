import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, className, ...props }: TextFieldProps) {
  return (
    <View className="w-full">
      <Text className="mb-2 text-[14px] font-semibold text-text">{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSubtle}
        className={`rounded-xl border border-text/10 bg-surface px-4 py-3.5 text-[16px] text-text ${
          error ? 'border-danger' : ''
        } ${className ?? ''}`}
        {...props}
      />
      {error ? (
        <Text className="mt-1.5 text-[13px] text-danger">{error}</Text>
      ) : null}
    </View>
  );
}
