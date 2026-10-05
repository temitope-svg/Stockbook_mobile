import { Text, View } from 'react-native';
import { BrandLogo } from './BrandLogo';
import { DashboardPreview } from './DashboardPreview';

export function HomeHero() {
  return (
    <View className="bg-background px-6 pb-10 pt-6">
      <View className="items-center">
        <BrandLogo />
        <Text className="mt-7 text-center text-[28px] font-bold leading-[1.15] tracking-tight text-text">
          Never lose track of stock or who owes you again
        </Text>
        <Text className="mt-4 text-center text-[15px] leading-relaxed text-text-muted">
          Replace the notebook. Know your stock, sales, and debts — all from
          your phone.
        </Text>
      </View>

      <View className="mt-9">
        <DashboardPreview />
      </View>
    </View>
  );
}
