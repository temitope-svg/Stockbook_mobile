import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  parseDateInput,
  startOfDay,
  toDateInputValue,
} from '../../../utils/dates';

export type InsightsPeriod = 'week' | 'month' | 'year' | 'custom';

const PERIODS: { id: InsightsPeriod; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'custom', label: 'Custom' },
];

type InsightsPeriodChipsProps = {
  value: InsightsPeriod;
  onChange: (next: InsightsPeriod) => void;
  dateFrom: string;
  dateTo: string;
  onCustomRange: (from: string, to: string) => void;
};

export function InsightsPeriodChips({
  value,
  onChange,
  dateFrom,
  dateTo,
  onCustomRange,
}: InsightsPeriodChipsProps) {
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);

  function onDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setPicking(null);
    if (event.type === 'dismissed') {
      setPicking(null);
      return;
    }
    if (!date || !picking) return;
    const next = toDateInputValue(startOfDay(date));
    if (picking === 'from') {
      const to = next > dateTo ? next : dateTo;
      onCustomRange(next, to);
    } else {
      const from = next < dateFrom ? next : dateFrom;
      onCustomRange(from, next);
    }
    if (Platform.OS === 'ios') setPicking(null);
  }

  return (
    <View>
      <View className="flex-row rounded-2xl bg-surface p-1">
        {PERIODS.map(period => {
          const active = value === period.id;
          return (
            <Pressable
              key={period.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(period.id)}
              className={
                active
                  ? 'flex-1 items-center rounded-xl bg-primary py-2.5 active:opacity-90'
                  : 'flex-1 items-center rounded-xl py-2.5 active:opacity-80'
              }
            >
              <Text
                className={
                  active
                    ? 'text-[13px] font-semibold text-white'
                    : 'text-[13px] font-medium text-text-muted'
                }
              >
                {period.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {value === 'custom' ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => setPicking('from')}
            className="flex-1 rounded-2xl border border-text/10 bg-surface px-3 py-3 active:opacity-80"
          >
            <Text className="text-[11px] font-medium text-text-subtle">From</Text>
            <Text className="mt-0.5 text-[14px] font-semibold text-text">
              {dateFrom}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPicking('to')}
            className="flex-1 rounded-2xl border border-text/10 bg-surface px-3 py-3 active:opacity-80"
          >
            <Text className="text-[11px] font-medium text-text-subtle">To</Text>
            <Text className="mt-0.5 text-[14px] font-semibold text-text">
              {dateTo}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {picking && Platform.OS === 'android' ? (
        <DateTimePicker
          value={
            picking === 'from'
              ? parseDateInput(dateFrom)
              : parseDateInput(dateTo)
          }
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      ) : null}

      {picking && Platform.OS === 'ios' ? (
        <View className="mt-2 overflow-hidden rounded-2xl bg-surface">
          <View className="flex-row items-center justify-between border-b border-text/5 px-4 py-2.5">
            <Pressable onPress={() => setPicking(null)}>
              <Text className="text-[15px] font-medium text-text-muted">
                Done
              </Text>
            </Pressable>
            <Text className="text-[13px] font-semibold text-text-subtle">
              {picking === 'from' ? 'Start date' : 'End date'}
            </Text>
          </View>
          <DateTimePicker
            value={
              picking === 'from'
                ? parseDateInput(dateFrom)
                : parseDateInput(dateTo)
            }
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        </View>
      ) : null}
    </View>
  );
}
