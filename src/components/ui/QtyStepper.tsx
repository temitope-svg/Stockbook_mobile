import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';

type QtyStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** sm = cart lines, md = record sale, lg = restock */
  size?: 'sm' | 'md' | 'lg';
  /** bordered = restock-style frame with button pads */
  variant?: 'plain' | 'bordered';
};

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  size = 'md',
  variant = 'plain',
}: QtyStepperProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const atMin = value <= min;
  const atMax = max != null && value >= max;

  const btnSize = size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-10 w-10' : 'h-12 w-12';
  const iconSize = size === 'sm' ? 16 : 18;
  const textClass =
    size === 'sm'
      ? 'min-w-0 flex-1 text-center text-[15px] font-semibold text-text'
      : size === 'lg'
        ? 'min-w-0 flex-1 text-center text-[20px] font-bold text-text'
        : 'min-w-0 flex-1 text-center text-[16px] font-semibold text-text';

  function clamp(n: number) {
    let next = n;
    if (max != null) next = Math.min(next, max);
    return Math.max(min, next);
  }

  function bump(delta: number) {
    onChange(clamp(value + delta));
  }

  function onTextChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setDraft(digits);
    if (digits === '') return;
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n)) return;
    onChange(clamp(n));
  }

  function onBlur() {
    setFocused(false);
    if (draft === '') {
      onChange(min);
      setDraft(String(min));
      return;
    }
    const n = Number.parseInt(draft, 10);
    const next = clamp(Number.isFinite(n) ? n : min);
    onChange(next);
    setDraft(String(next));
  }

  const containerClass =
    variant === 'bordered'
      ? 'flex-row items-center rounded-2xl border border-text/10 bg-surface px-2 py-2'
      : size === 'sm'
        ? 'flex-row items-center rounded-xl bg-background'
        : 'flex-row items-center rounded-2xl bg-surface';

  const buttonClass =
    variant === 'bordered'
      ? `${btnSize} items-center justify-center rounded-xl bg-background active:opacity-70`
      : `${btnSize} items-center justify-center active:opacity-70`;

  return (
    <View className={containerClass}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        className={buttonClass}
        onPress={() => bump(-1)}
        disabled={atMin}
      >
        <Minus
          color={atMin ? colors.textSubtle : colors.text}
          size={iconSize}
          strokeWidth={2}
        />
      </Pressable>

      <TextInput
        value={focused ? draft : String(value)}
        onChangeText={onTextChange}
        onFocus={() => {
          setFocused(true);
          setDraft(String(value));
        }}
        onBlur={onBlur}
        keyboardType="number-pad"
        selectTextOnFocus
        accessibilityLabel="Quantity"
        className={textClass}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        className={buttonClass}
        onPress={() => bump(1)}
        disabled={atMax}
      >
        <Plus
          color={atMax ? colors.textSubtle : colors.text}
          size={iconSize}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}
