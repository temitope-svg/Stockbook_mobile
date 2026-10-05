import { useRef } from 'react';
import {
  Text,
  TextInput,
  View,
  type TextInputKeyPressEvent,
} from 'react-native';
import { colors } from '../../theme/colors';

type OtpInputProps = {
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
  length?: number;
};

type InputRef = {
  focus: () => void;
};

export function OtpInput({
  value,
  onChange,
  error,
  disabled,
  length = 6,
}: OtpInputProps) {
  const refs = useRef<Array<InputRef | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  function update(index: number, char: string) {
    const next = chars.map((c, i) => (i === index ? char : c));
    const joined = next.join('').replace(/\D/g, '').slice(0, length);
    onChange(joined);
    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function onKeyPress(index: number, e: TextInputKeyPressEvent) {
    if (
      e.nativeEvent.key === 'Backspace' &&
      !chars[index] &&
      index > 0
    ) {
      update(index - 1, '');
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View>
      <View className="flex-row justify-between gap-2">
        {chars.map((digit, index) => (
          <TextInput
            key={index}
            ref={el => {
              refs.current[index] = el as InputRef | null;
            }}
            value={digit}
            editable={!disabled}
            keyboardType="number-pad"
            maxLength={1}
            textContentType="oneTimeCode"
            selectTextOnFocus
            onChangeText={text => {
              const char = text.replace(/\D/g, '').slice(-1);
              update(index, char);
            }}
            onKeyPress={e => onKeyPress(index, e)}
            className={
              error
                ? 'h-14 flex-1 rounded-xl border border-danger bg-surface text-center text-[22px] font-bold text-text'
                : 'h-14 flex-1 rounded-xl border border-text/10 bg-surface text-center text-[22px] font-bold text-text'
            }
            placeholderTextColor={colors.textSubtle}
          />
        ))}
      </View>
      {error ? (
        <Text className="mt-2 text-center text-[13px] text-danger">{error}</Text>
      ) : null}
    </View>
  );
}
