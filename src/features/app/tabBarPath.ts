/**
 * SVG path for a white tab bar with a circular notch carved from the top.
 * Worklet-safe so Reanimated can rebuild `d` as the active tab slides.
 */
export function buildTabBarPath(
  width: number,
  height: number,
  centerX: number,
  notchRadius: number,
): string {
  'worklet';
  const r = notchRadius;
  const shoulder = 16;
  const left = centerX - r - shoulder;
  const right = centerX + r + shoulder;
  const rim = 1;

  return [
    `M0,0`,
    `L${left},0`,
    `C${left + shoulder * 0.4},0 ${centerX - r - 2},${rim} ${centerX - r},${r * 0.5}`,
    // sweep=1 (clockwise, y-down): arc dips into the bar body
    `A${r},${r} 0 0 1 ${centerX + r},${r * 0.5}`,
    `C${centerX + r + 2},${rim} ${right - shoulder * 0.4},0 ${right},0`,
    `L${width},0`,
    `L${width},${height}`,
    `L0,${height}`,
    `Z`,
  ].join(' ');
}

export const TAB_BUBBLE_SIZE = 56;
export const TAB_NOTCH_RADIUS = 32;
/** Space above the bar body reserved for the bubble / notch. */
export const TAB_BUBBLE_LIFT = 22;
/** Content row height below the lift (icons + labels). */
export const TAB_BAR_CONTENT_HEIGHT = 56;
/** Extra downward offset so the circle sits deeper in the notch. */
export const TAB_BUBBLE_INSET = 10;
