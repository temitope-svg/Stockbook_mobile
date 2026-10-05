import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
};

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 28 }}
    >
      <Text className="text-[28px] font-bold tracking-tight text-text">
        {title}
      </Text>
      <Text className="mt-2 text-[15px] leading-relaxed text-text-muted">
        {subtitle ?? 'This screen is coming next.'}
      </Text>
    </View>
  );
}
