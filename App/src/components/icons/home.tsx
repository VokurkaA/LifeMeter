import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height' | 'fill'> & {
  size?: number;       // fallback if no className sizing provided
  className?: string;  // Tailwind classes (e.g., "h-6 w-6 text-white")
  fill?: string;       // optional explicit fill color (overrides currentColor)
};

export default function HomeIcon({
  size = 24,
  className,
  fill,
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const fillValue = fill ?? 'currentColor';

  return (
    <Svg
      viewBox="0 -960 960 960"
      className={className ?? 'h-6 w-6 text-foreground'}
      fill="none"
      {...sizeProps}
      {...rest}
    >
      <Path
        fill={fillValue}
        d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"
      />
    </Svg>
  );
}
