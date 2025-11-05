import { cssInterop } from 'nativewind';
import Svg, { Line, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Variant = 'left-shrink' | 'center-shrink' | 'right-shrink' | 'even';

type Props = Omit<SvgProps, 'width' | 'height' | 'stroke'> & {
  size?: number; // fallback if no className sizing provided
  className?: string; // Tailwind classes (e.g., "h-6 w-6 text-white")
  stroke?: string; // optional explicit stroke color (overrides currentColor)
  variant?: Variant; // line layout variant
};

export default function HamburgerIcon({
  size = 24,
  className,
  stroke,
  strokeWidth = 2,
  variant = 'even',
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const strokeValue = stroke ?? 'currentColor';

  const lines: [number, number, number][] = (() => {
    switch (variant) {
      case 'center-shrink':
        return [
          [6, 7, 18], // length 12
          [8, 12, 16], // length 8
          [10, 17, 14], // length 4
        ];
      case 'right-shrink':
        return [
          [6, 7, 18], // length 12
          [10, 12, 18], // length 8
          [14, 17, 18], // length 4
        ];
      case 'even':
        return [
          [6, 7, 18],
          [6, 12, 18],
          [6, 17, 18],
        ];
      case 'left-shrink':
      default:
        return [
          [6, 7, 18], // length 12
          [6, 12, 14], // length 8
          [6, 17, 10], // length 4
        ];
    }
  })();

  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      className={className ?? 'h-6 w-6 text-foreground'}
      {...sizeProps}
      {...rest}
    >
      {lines.map(([x1, y, x2], idx) => (
        <Line
          key={idx}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={strokeValue}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
