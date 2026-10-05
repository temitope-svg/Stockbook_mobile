import { Text, View } from 'react-native';

type StepDotsProps = {
  current: 1 | 2 | 3;
  total?: 3;
};

export function StepDots({ current, total = 3 }: StepDotsProps) {
  return (
    <View className="mt-6 flex-row items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const active = step === current;
        const done = step < current;
        return (
          <View
            key={step}
            className={
              active
                ? 'h-2 w-6 rounded-full bg-primary'
                : done
                  ? 'h-2 w-2 rounded-full bg-primary/50'
                  : 'h-2 w-2 rounded-full bg-text/15'
            }
          />
        );
      })}
    </View>
  );
}

export function StepLabel({
  current,
  label,
}: {
  current: number;
  label?: string;
}) {
  return (
    <Text className="text-[12px] font-semibold tracking-wide text-primary uppercase">
      {label ?? `Step ${current} of 3`}
    </Text>
  );
}
