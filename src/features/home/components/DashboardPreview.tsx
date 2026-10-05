import { Text, View } from 'react-native';

export function DashboardPreview() {
  return (
    <View className="overflow-hidden rounded-[22px] border-[3px] border-text/90 bg-primary">
      <View className="px-5 pb-4 pt-5">
        <Text className="text-[13px] font-medium text-white/90">
          Good afternoon
        </Text>
        <Text className="mt-0.5 text-[22px] font-bold tracking-tight text-white">
          King's Wear
        </Text>
      </View>

      <View className="bg-surface px-3.5 pb-3.5 pt-3">
        <View className="flex-row gap-2.5">
          <View className="flex-1 rounded-2xl bg-primary-tint px-3.5 py-3.5">
            <Text className="text-[12px] font-medium text-primary">
              Today's sales
            </Text>
            <Text className="mt-1 text-[22px] font-bold tracking-tight text-primary">
              ₦84,000
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-accent-tint px-3.5 py-3.5">
            <Text className="text-[12px] font-medium text-accent">
              Owed to you
            </Text>
            <Text className="mt-1 text-[22px] font-bold tracking-tight text-accent">
              ₦32,500
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
