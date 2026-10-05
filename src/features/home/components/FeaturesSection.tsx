import {
  Package,
  ShoppingBag,
  Users,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Feature = {
  icon: LucideIcon;
  label: string;
  iconColor: string;
  tone: 'stock' | 'sales' | 'debt' | 'offline';
};

const features: Feature[] = [
  {
    icon: Package,
    label: 'Track stock',
    iconColor: colors.primary,
    tone: 'stock',
  },
  {
    icon: ShoppingBag,
    label: 'Record sales',
    iconColor: colors.accent,
    tone: 'sales',
  },
  {
    icon: Users,
    label: 'Track debt',
    iconColor: colors.danger,
    tone: 'debt',
  },
  {
    icon: WifiOff,
    label: 'Works offline',
    iconColor: colors.teal,
    tone: 'offline',
  },
];

function FeatureIconTone({
  tone,
  children,
}: {
  tone: Feature['tone'];
  children: ReactNode;
}) {
  if (tone === 'stock') {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint">
        {children}
      </View>
    );
  }
  if (tone === 'sales') {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint">
        {children}
      </View>
    );
  }
  if (tone === 'debt') {
    return (
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-danger-tint">
        {children}
      </View>
    );
  }
  return (
    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-tint">
      {children}
    </View>
  );
}

function FeatureCard({ icon: Icon, label, iconColor, tone }: Feature) {
  return (
    <View className="w-[48%] items-center rounded-2xl bg-surface px-4 py-6">
      <FeatureIconTone tone={tone}>
        <Icon color={iconColor} size={24} strokeWidth={1.8} />
      </FeatureIconTone>
      <Text className="mt-3 text-center text-[15px] font-semibold tracking-tight text-text">
        {label}
      </Text>
    </View>
  );
}

export function FeaturesSection() {
  return (
    <View className="bg-background px-6 py-12">
      <Text className="text-center text-[24px] font-bold tracking-tight text-text">
        Everything your shop needs
      </Text>

      <View className="mt-8 flex-row flex-wrap justify-between gap-y-3">
        {features.map(feature => (
          <FeatureCard key={feature.label} {...feature} />
        ))}
      </View>
    </View>
  );
}
