import Svg, { Circle, Path } from 'react-native-svg';

type SalesSparklineProps = {
  width?: number;
  height?: number;
};

/** Soft trend wave for the sales hero card. */
export function SalesSparkline({ width = 220, height = 56 }: SalesSparklineProps) {
  const d = `M0 ${height * 0.72}
    C ${width * 0.12} ${height * 0.78}, ${width * 0.2} ${height * 0.55}, ${width * 0.3} ${height * 0.62}
    S ${width * 0.48} ${height * 0.35}, ${width * 0.58} ${height * 0.42}
    S ${width * 0.78} ${height * 0.22}, ${width * 0.88} ${height * 0.28}
    L ${width} ${height * 0.18}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={d}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={width}
        cy={height * 0.18}
        r={4.5}
        fill="#ffffff"
      />
    </Svg>
  );
}
