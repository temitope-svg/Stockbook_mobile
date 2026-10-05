import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBrandHeader } from '../../features/auth/components/AuthBrandHeader';

type AuthShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  showBrand?: boolean;
};

export function AuthShell({
  children,
  footer,
  showBrand = true,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View
        pointerEvents="none"
        className="absolute -left-16 -top-10 h-56 w-56 rounded-full bg-primary/10"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-accent/10"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 28),
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showBrand ? (
          <View className="mt-8 items-center">
            <AuthBrandHeader />
          </View>
        ) : null}

        <View className="mt-8 rounded-[28px] border border-text/5 bg-surface px-5 py-6 shadow-sm shadow-black/10">
          {children}
        </View>

        {footer ? (
          <View className="mt-6 items-center px-2">
            {typeof footer === 'string' ? (
              <Text className="text-center text-[14px] text-text-muted">
                {footer}
              </Text>
            ) : (
              footer
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
