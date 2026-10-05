import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CtaStickerProps = {
  onGetStarted?: () => void;
  onSignIn?: () => void;
};

/** Soft wash so scrolling content eases under the sticker. */
function StickerFade() {
  return (
    <View className="h-10" pointerEvents="none">
      <View className="flex-1 bg-background/10" />
      <View className="flex-1 bg-background/25" />
      <View className="flex-1 bg-background/45" />
      <View className="flex-1 bg-background/70" />
      <View className="flex-1 bg-background/90" />
    </View>
  );
}

export function CtaSticker({ onGetStarted, onSignIn }: CtaStickerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute inset-x-0 bottom-0"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
      pointerEvents="box-none"
    >
      <StickerFade />
      <View className="px-3" pointerEvents="box-none">
        <View className="rounded-[28px] bg-primary px-5 pb-5 pt-6 shadow-lg shadow-black/25 elevation-8">
          <Text className="text-center text-[22px] font-bold tracking-tight text-white">
            Ready to stop guessing?
          </Text>
          <Text className="mt-1.5 text-center text-[13px] text-white/80">
            Free to start · No card needed
          </Text>

          <Pressable
            accessibilityRole="button"
            className="mt-5 items-center rounded-2xl bg-accent py-3.5 active:opacity-90"
            onPress={onGetStarted}
          >
            <Text className="text-[15px] font-semibold text-white">
              Get started free
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="mt-2.5 items-center rounded-2xl bg-primary-soft py-3.5 active:opacity-90"
            onPress={onSignIn}
          >
            <Text className="text-[15px] font-semibold text-white">
              I already have an account
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
