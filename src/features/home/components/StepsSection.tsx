import { Text, View } from 'react-native';

const steps = [
  {
    n: '1',
    title: 'Add your products',
    body: 'Set up your shop in a few minutes.',
  },
  {
    n: '2',
    title: 'Record sales as they happen',
    body: 'Mark each sale paid or on credit.',
  },
  {
    n: '3',
    title: 'Stay on top of your shop',
    body: 'See stock, sales, and debt at a glance.',
  },
] as const;

export function StepsSection() {
  return (
    <View className="bg-surface px-6 py-12">
      <Text className="text-center text-[24px] font-bold tracking-tight text-primary">
        Get started in three steps
      </Text>

      <View className="mt-10 gap-8">
        {steps.map(step => (
          <View key={step.n} className="items-center px-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Text className="text-[17px] font-bold text-white">{step.n}</Text>
            </View>
            <Text className="mt-4 text-center text-[17px] font-semibold tracking-tight text-primary">
              {step.title}
            </Text>
            <Text className="mt-1.5 text-center text-[14px] leading-relaxed text-text-muted">
              {step.body}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
