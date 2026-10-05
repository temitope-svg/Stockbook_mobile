import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { startOfDay } from '../../../utils/dates';
import type { SalesStatusFilter } from '../hooks/useSalesList';

const FILTERS: { value: SalesStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'credit', label: 'On credit' },
  { value: 'partial', label: 'Partial' },
];

type SalesFilterChipsProps = {
  value: SalesStatusFilter;
  onChange: (next: SalesStatusFilter) => void;
  selectedDate: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onPickDate: (date: Date) => void;
};

export function SalesFilterChips({
  value,
  onChange,
  selectedDate,
  minimumDate,
  maximumDate,
  onPickDate,
}: SalesFilterChipsProps) {
  const [open, setOpen] = useState(false);

  function onDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) {
      onPickDate(startOfDay(date));
    }
  }

  return (
    <View>
      <View className="flex-row items-center pl-5 pr-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {FILTERS.map(filter => {
            const active = value === filter.value;
            return (
              <Pressable
                key={filter.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(filter.value)}
                className={
                  active
                    ? 'rounded-full bg-primary px-4 py-2.5 active:opacity-90'
                    : 'rounded-full border border-text/10 bg-surface px-4 py-2.5 active:opacity-90'
                }
              >
                <Text
                  className={
                    active
                      ? 'text-[13px] font-semibold text-white'
                      : 'text-[13px] font-medium text-text'
                  }
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pick a date"
          className="ml-1 h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-80"
          onPress={() => setOpen(current => !current)}
        >
          <CalendarDays color={colors.primary} size={18} strokeWidth={1.8} />
        </Pressable>
      </View>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="calendar"
          maximumDate={maximumDate ?? new Date()}
          minimumDate={minimumDate}
          onChange={onDateChange}
        />
      ) : null}

      {open && Platform.OS === 'ios' ? (
        <View className="mx-5 mt-2 overflow-hidden rounded-2xl bg-surface">
          <View className="flex-row items-center justify-between border-b border-text/5 px-4 py-2.5">
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              className="active:opacity-70"
            >
              <Text className="text-[15px] font-medium text-text-muted">
                Cancel
              </Text>
            </Pressable>
            <Text className="text-[13px] font-semibold text-text-subtle">
              Select day
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              className="active:opacity-70"
            >
              <Text className="text-[15px] font-semibold text-primary">Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            themeVariant="light"
            maximumDate={maximumDate ?? new Date()}
            minimumDate={minimumDate}
            onChange={onDateChange}
            style={{ height: 180 }}
          />
        </View>
      ) : null}
    </View>
  );
}
