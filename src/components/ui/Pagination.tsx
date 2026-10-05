import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

function NavButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={
        disabled
          ? 'h-11 w-11 items-center justify-center rounded-2xl bg-background opacity-40'
          : 'h-11 w-11 items-center justify-center rounded-2xl bg-background active:opacity-70'
      }
    >
      {children}
    </Pressable>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  start,
  end,
  onPageChange,
  itemLabel = 'products',
}: PaginationProps) {
  if (total === 0) return null;

  const showControls = totalPages > 1;
  const showDots = totalPages > 1 && totalPages <= 6;

  return (
    <View className="border-t border-text/5 bg-surface px-4 py-3">
      <View className="flex-row items-center gap-3">
        {showControls ? (
          <NavButton
            label="Previous page"
            disabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
          >
            <ChevronLeft
              color={page <= 1 ? colors.textSubtle : colors.primary}
              size={22}
              strokeWidth={2.2}
            />
          </NavButton>
        ) : null}

        <View className="min-w-0 flex-1 items-center">
          <Text className="text-[15px] font-bold text-text">
            {start}–{end}
            <Text className="font-medium text-text-muted">
              {' '}
              of {total}
            </Text>
          </Text>
          <Text className="mt-0.5 text-[12px] text-text-subtle">
            {showControls
              ? `Page ${page} of ${totalPages}`
              : itemLabel}
          </Text>

          {showDots ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => {
                const active = i + 1 === page;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Page ${i + 1}`}
                    hitSlop={8}
                    onPress={() => onPageChange(i + 1)}
                    className={
                      active
                        ? 'h-1.5 w-4 rounded-full bg-primary'
                        : 'h-1.5 w-1.5 rounded-full bg-text/15'
                    }
                  />
                );
              })}
            </View>
          ) : null}
        </View>

        {showControls ? (
          <NavButton
            label="Next page"
            disabled={page >= totalPages}
            onPress={() => onPageChange(page + 1)}
          >
            <ChevronRight
              color={page >= totalPages ? colors.textSubtle : colors.primary}
              size={22}
              strokeWidth={2.2}
            />
          </NavButton>
        ) : null}
      </View>
    </View>
  );
}
