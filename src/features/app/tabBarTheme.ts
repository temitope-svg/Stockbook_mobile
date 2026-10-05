import type { ViewStyle } from 'react-native';
import { TAB_BAR_CONTENT_HEIGHT, TAB_BUBBLE_LIFT } from './tabBarPath';

/** Shared tab bar chrome — keep in sync when screens hide/restore the bar. */
export const TAB_BAR_STYLE: ViewStyle = {
  backgroundColor: 'transparent',
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
  // Bubble lift + content + typical home-indicator pad; BubbleTabBar reports exact height
  height: TAB_BUBBLE_LIFT + TAB_BAR_CONTENT_HEIGHT + 34,
};