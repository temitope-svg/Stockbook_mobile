import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import {
  Box,
  Ellipsis,
  House,
  ReceiptText,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useContext, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import {
  buildTabBarPath,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BUBBLE_INSET,
  TAB_BUBBLE_LIFT,
  TAB_BUBBLE_SIZE,
  TAB_NOTCH_RADIUS,
} from './tabBarPath';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TAB_META: Record<string, { icon: LucideIcon; label: string }> = {
  HomeTab: { icon: House, label: 'Home' },
  ProductsTab: { icon: Box, label: 'Products' },
  SalesTab: { icon: ReceiptText, label: 'Sales' },
  CustomersTab: { icon: Users, label: 'Customers' },
  MoreTab: { icon: Ellipsis, label: 'More' },
};

const INDEX_SPRING = { damping: 16, stiffness: 180, mass: 0.85 };
const POP_SPRING = { damping: 12, stiffness: 220, mass: 0.7 };

type BubbleTabItemProps = {
  routeName: string;
  index: number;
  focused: boolean;
  activeIndex: SharedValue<number>;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
};

function BubbleTabItem({
  routeName,
  index,
  focused,
  activeIndex,
  accessibilityLabel,
  onPress,
  onLongPress,
}: BubbleTabItemProps) {
  const meta = TAB_META[routeName] ?? { icon: House, label: routeName };
  const Icon = meta.icon;
  const pressScale = useSharedValue(1);

  // Fade out the in-bar copy when this tab is active — the bubble owns that icon.
  const slotStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      activeIndex.value,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: interpolate(progress, [0, 0.55, 1], [1, 0.15, 0], Extrapolation.CLAMP),
      transform: [{ scale: pressScale.value }],
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? meta.label}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        pressScale.value = withSpring(0.9, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, { damping: 14, stiffness: 220 });
      }}
      style={styles.itemHit}
    >
      <Animated.View style={[styles.itemInner, slotStyle]}>
        <Icon color={colors.textSubtle} size={22} strokeWidth={1.75} />
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={styles.labelInactive}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BubbleTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const { width: windowWidth } = useWindowDimensions();
  const bottomPad = Math.max(insets.bottom, 8);
  const barBodyHeight = TAB_BAR_CONTENT_HEIGHT + bottomPad;
  const totalHeight = TAB_BUBBLE_LIFT + barBodyHeight;
  const tabCount = state.routes.length;

  const widthSV = useSharedValue(windowWidth);
  const activeIndex = useSharedValue(state.index);
  const bubblePop = useSharedValue(1);

  const focusedRoute = state.routes[state.index];
  const focusedMeta =
    TAB_META[focusedRoute?.name ?? ''] ?? { icon: House, label: 'Home' };
  const FocusedIcon = focusedMeta.icon;

  const focusedOptions =
    descriptors[focusedRoute?.key ?? '']?.options;
  const flattened = StyleSheet.flatten(focusedOptions?.tabBarStyle);
  const hideBar =
    flattened != null &&
    typeof flattened === 'object' &&
    'display' in flattened &&
    flattened.display === 'none';

  useEffect(() => {
    onHeightChange?.(hideBar ? 0 : totalHeight);
  }, [hideBar, totalHeight, onHeightChange]);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, INDEX_SPRING);
    bubblePop.value = 0.88;
    bubblePop.value = withSpring(1, POP_SPRING);
  }, [state.index, activeIndex, bubblePop]);

  const animatedPathProps = useAnimatedProps(() => {
    const w = widthSV.value;
    const tabW = w / Math.max(tabCount, 1);
    const centerX = tabW * activeIndex.value + tabW / 2;
    return {
      d: buildTabBarPath(w, barBodyHeight, centerX, TAB_NOTCH_RADIUS),
    };
  });

  const bubbleStyle = useAnimatedStyle(() => {
    const w = widthSV.value;
    const tabW = w / Math.max(tabCount, 1);
    const centerX = tabW * activeIndex.value + tabW / 2;
    return {
      transform: [
        { translateX: centerX - TAB_BUBBLE_SIZE / 2 },
        {
          translateY: interpolate(
            bubblePop.value,
            [0.88, 1],
            [6, 0],
            Extrapolation.CLAMP,
          ),
        },
        { scale: bubblePop.value },
      ],
    };
  });

  const initialCenterX =
    (windowWidth / Math.max(tabCount, 1)) * state.index +
    windowWidth / Math.max(tabCount, 1) / 2;
  const initialPath = buildTabBarPath(
    windowWidth,
    barBodyHeight,
    initialCenterX,
    TAB_NOTCH_RADIUS,
  );

  // Seat the circle deeper in the notch (pushed inward / down).
  const bubbleTop =
    TAB_BUBBLE_LIFT - TAB_BUBBLE_SIZE / 2 + TAB_BUBBLE_INSET;

  if (hideBar) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { height: totalHeight }]}
      onLayout={e => {
        widthSV.value = e.nativeEvent.layout.width;
        onHeightChange?.(e.nativeEvent.layout.height);
      }}
    >
      <Animated.View style={[styles.bubble, { top: bubbleTop }, bubbleStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          accessibilityLabel={focusedMeta.label}
          onPress={() => {
            if (!focusedRoute) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: focusedRoute.key,
              canPreventDefault: true,
            });
            // Already focused — still emit (Sales tab resets stack). No navigate.
            void event;
          }}
          style={styles.bubbleHit}
        >
          <Animated.View
            key={focusedRoute?.key ?? 'tab'}
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(100)}
            style={styles.bubbleContent}
          >
            <FocusedIcon
              color={colors.primary}
              size={22}
              strokeWidth={2.35}
            />
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              style={styles.labelActive}
            >
              {focusedMeta.label}
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View
        style={[
          styles.barBody,
          { marginTop: TAB_BUBBLE_LIFT, height: barBodyHeight },
        ]}
      >
        <Svg
          width="100%"
          height={barBodyHeight}
          style={StyleSheet.absoluteFill}
        >
          <AnimatedPath
            d={initialPath}
            animatedProps={animatedPathProps}
            fill={colors.surface}
          />
        </Svg>

        <View style={[styles.row, { height: TAB_BAR_CONTENT_HEIGHT }]}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const meta = TAB_META[route.name];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, route.params),
                  target: state.key,
                });
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <BubbleTabItem
                key={route.key}
                routeName={route.name}
                index={index}
                focused={isFocused}
                activeIndex={activeIndex}
                accessibilityLabel={
                  options.tabBarAccessibilityLabel ?? meta?.label
                }
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    overflow: 'visible',
  },
  barBody: {
    overflow: 'visible',
    backgroundColor: 'transparent',
    shadowColor: '#2c2c2a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 12,
  },
  bubble: {
    position: 'absolute',
    left: 0,
    width: TAB_BUBBLE_SIZE,
    height: TAB_BUBBLE_SIZE,
    borderRadius: TAB_BUBBLE_SIZE / 2,
    backgroundColor: colors.primaryTint,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleHit: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: TAB_BUBBLE_SIZE / 2,
  },
  bubbleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 3,
  },
  itemHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingBottom: 8,
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  labelInactive: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSubtle,
    textAlign: 'center',
  },
  labelActive: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
});
