import { Pressable, ScrollView, Text } from 'react-native';
import type { CustomerFilter } from '../hooks/useCustomerLedger';

type CustomersFilterChipsProps = {
  value: CustomerFilter;
  owesCount: number;
  overdueCount: number;
  onChange: (next: CustomerFilter) => void;
};

export function CustomersFilterChips({
  value,
  owesCount,
  overdueCount,
  onChange,
}: CustomersFilterChipsProps) {
  const filters: { value: CustomerFilter; label: string; tone?: 'accent' | 'danger' }[] =
    [
      { value: 'all', label: 'All' },
      { value: 'owes', label: `Owes money ${owesCount}`, tone: 'accent' },
      { value: 'overdue', label: `Overdue ${overdueCount}`, tone: 'danger' },
      { value: 'paid', label: 'Paid up' },
    ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {filters.map(filter => {
        const active = value === filter.value;
        let className =
          'rounded-full border border-text/10 bg-surface px-4 py-2.5 active:opacity-90';
        let textClass = 'text-[13px] font-medium text-text';

        if (active) {
          className = 'rounded-full bg-primary px-4 py-2.5 active:opacity-90';
          textClass = 'text-[13px] font-semibold text-white';
        } else if (filter.tone === 'accent') {
          className =
            'rounded-full border border-accent/30 bg-accent-tint/50 px-4 py-2.5 active:opacity-90';
          textClass = 'text-[13px] font-medium text-accent';
        } else if (filter.tone === 'danger') {
          className =
            'rounded-full border border-danger/20 bg-danger-tint/70 px-4 py-2.5 active:opacity-90';
          textClass = 'text-[13px] font-medium text-danger';
        }

        return (
          <Pressable
            key={filter.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(filter.value)}
            className={className}
          >
            <Text className={textClass}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
