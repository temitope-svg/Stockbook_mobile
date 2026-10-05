import { AlertTriangle } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

export type ProductFilter =
  | { type: 'all' }
  | { type: 'low' }
  | { type: 'category'; value: string }
  | { type: 'archive' };

type ProductFilterChipsProps = {
  filter: ProductFilter;
  categories: string[];
  lowStockCount: number;
  onChange: (next: ProductFilter) => void;
};

export function ProductFilterChips({
  filter,
  categories,
  lowStockCount,
  onChange,
}: ProductFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      <Chip
        label="All"
        active={filter.type === 'all'}
        onPress={() => onChange({ type: 'all' })}
      />
      <Chip
        label={`Low stock ${lowStockCount}`}
        active={filter.type === 'low'}
        warning
        onPress={() => onChange({ type: 'low' })}
      />
      {categories.map(category => (
        <Chip
          key={category}
          label={category}
          active={filter.type === 'category' && filter.value === category}
          onPress={() => onChange({ type: 'category', value: category })}
        />
      ))}
      <Chip
        label="Archive"
        active={filter.type === 'archive'}
        onPress={() => onChange({ type: 'archive' })}
      />
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  warning,
  onPress,
}: {
  label: string;
  active: boolean;
  warning?: boolean;
  onPress: () => void;
}) {
  if (active) {
    return (
      <Pressable
        onPress={onPress}
        className="rounded-full bg-primary px-4 py-2.5 active:opacity-90"
      >
        <Text className="text-[13px] font-semibold text-white">{label}</Text>
      </Pressable>
    );
  }

  if (warning) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-1.5 rounded-full border border-accent/40 bg-surface px-3.5 py-2.5 active:opacity-90"
      >
        <AlertTriangle color={colors.accent} size={14} strokeWidth={2} />
        <Text className="text-[13px] font-semibold text-accent">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="rounded-full border border-text/10 bg-surface px-4 py-2.5 active:opacity-90"
    >
      <View>
        <Text className="text-[13px] font-medium text-text-muted">{label}</Text>
      </View>
    </Pressable>
  );
}
