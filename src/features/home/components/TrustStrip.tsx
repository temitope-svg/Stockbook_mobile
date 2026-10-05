import { Text, View } from 'react-native';

export function TrustStrip() {
  return (
    <View className="items-center bg-background px-6 pb-6 pt-2">
      <Text className="text-center text-[13px] font-medium tracking-wide text-text-subtle">
        Made in Nigeria, for Nigerian traders
      </Text>
      <Text className="mt-1 text-center text-[12px] text-text-subtle">
        Naira-first · Built for shops that still use notebooks
      </Text>
    </View>
  );
}
