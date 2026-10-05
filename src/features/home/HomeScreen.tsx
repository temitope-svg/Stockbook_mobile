import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CtaSticker } from './components/CtaSticker';
import { FeaturesSection } from './components/FeaturesSection';
import { HomeHero } from './components/HomeHero';
import { ProblemSection } from './components/ProblemSection';
import { StepsSection } from './components/StepsSection';
import { TrustStrip } from './components/TrustStrip';

/** Space reserved so scroll content clears the sticky CTA sticker. */
const CTA_STICKER_CLEARANCE = 240;

type HomeScreenProps = {
  onGetStarted?: () => void;
  onSignIn?: () => void;
};

export function HomeScreen({ onGetStarted, onSignIn }: HomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: CTA_STICKER_CLEARANCE + Math.max(insets.bottom, 10),
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHero />
        <ProblemSection />
        <FeaturesSection />
        <StepsSection />
        <TrustStrip />
      </ScrollView>

      <CtaSticker onGetStarted={onGetStarted} onSignIn={onSignIn} />
    </View>
  );
}
