import { useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const logoSource = require('../../assets/brand/logo.png');

const MIN_VISIBLE_MS = 2200;
const EXIT_MS = 480;
const TRACK_WIDTH = 168;

type SplashScreenProps = {
  isReady: boolean;
  onFinish: () => void;
};

export function SplashScreen({ isReady, onFinish }: SplashScreenProps) {
  const mountedAt = useRef(Date.now());
  const entrance = useSharedValue(0);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.45);
  const bar = useSharedValue(0.18);
  const exit = useSharedValue(1);
  const accent = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 14, stiffness: 90, mass: 0.85 });
    accent.value = withDelay(
      380,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    float.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-7, {
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.72, {
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0.4, {
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
    bar.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(0.18, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [accent, bar, entrance, float, glow]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mountedAt.current));
    const timer = setTimeout(() => {
      exit.value = withTiming(
        0,
        { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) {
            runOnJS(onFinish)();
          }
        },
      );
    }, wait);

    return () => clearTimeout(timer);
  }, [exit, isReady, onFinish]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: exit.value,
    transform: [{ scale: interpolate(exit.value, [0, 1], [1.06, 1]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * exit.value,
    transform: [{ scale: interpolate(glow.value, [0.4, 0.72], [0.92, 1.08]) }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: float.value + interpolate(entrance.value, [0, 1], [28, 0]) },
      { scale: interpolate(entrance.value, [0, 1], [0.72, 1]) },
    ],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.35, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(entrance.value, [0.35, 1], [18, 0]),
      },
    ],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accent.value,
    transform: [{ scaleX: accent.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.55, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(entrance.value, [0.55, 1], [12, 0]),
      },
    ],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: bar.value * TRACK_WIDTH,
    opacity: exit.value,
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <View style={styles.atmosphere} pointerEvents="none">
        <Animated.View style={[styles.glowPrimary, glowStyle]} />
        <View style={styles.glowAccent} />
        <View style={styles.glowSoft} />
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image
            accessibilityLabel="Stockbook"
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={wordmarkStyle}>
          <Text style={styles.wordmark}>Stockbook</Text>
        </Animated.View>

        <Animated.View style={[styles.accentLine, accentStyle]} />

        <Animated.View style={tagStyle}>
          <Text style={styles.tagline}>Stock · Sales · Debts</Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeIn.delay(700).duration(500)}
        style={styles.footer}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.fill, barStyle]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
  },
  glowPrimary: {
    position: 'absolute',
    top: '26%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  glowAccent: {
    position: 'absolute',
    bottom: '18%',
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.08,
  },
  glowSoft: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primarySoft,
    opacity: 0.07,
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    width: 132,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 10,
  },
  logo: {
    width: 132,
    height: 148,
  },
  wordmark: {
    marginTop: 28,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.primary,
  },
  accentLine: {
    marginTop: 14,
    height: 3,
    width: 44,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  tagline: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.4,
    color: colors.textSubtle,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 110, 86, 0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
