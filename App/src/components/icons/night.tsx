import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height' | 'fill'> & {
  size?: number;       // fallback if no className sizing provided
  className?: string;  // Tailwind classes (e.g., "h-6 w-6 text-white")
  fill?: string;       // optional explicit fill color (overrides currentColor)
};

export default function NightIcon({
  size = 24,
  className,
  fill,
  ...rest
}: Props) {
  const sizeProps = className ? {} : { width: size, height: size };
  const fillValue = fill ?? 'currentColor';

  return (
    <Svg
      viewBox="0 0 61 60"
      className={className ?? 'h-6 w-6 text-foreground'}
      fill="none"
      {...sizeProps}
      {...rest}
    >
      <Path
        d="M39.075 18L30.075 9L39.075 0L48.075 9L39.075 18ZM54.075 27L48.075 21L54.075 15L60.075 21L54.075 27ZM30.3 60C26.1 60 22.1625 59.2 18.4875 57.6C14.8125 56 11.6125 53.8375 8.8875 51.1125C6.1625 48.3875 4 45.1875 2.4 41.5125C0.8 37.8375 0 33.9 0 29.7C0 22.4 2.325 15.9625 6.975 10.3875C11.625 4.8125 17.55 1.35 24.75 0C23.85 4.95 24.125 9.7875 25.575 14.5125C27.025 19.2375 29.525 23.375 33.075 26.925C36.625 30.475 40.7625 32.975 45.4875 34.425C50.2125 35.875 55.05 36.15 60 35.25C58.7 42.45 55.25 48.375 49.65 53.025C44.05 57.675 37.6 60 30.3 60ZM30.3 54C34.7 54 38.775 52.9 42.525 50.7C46.275 48.5 49.225 45.475 51.375 41.625C47.075 41.225 43 40.1375 39.15 38.3625C35.3 36.5875 31.85 34.175 28.8 31.125C25.75 28.075 23.325 24.625 21.525 20.775C19.725 16.925 18.65 12.85 18.3 8.55C14.45 10.7 11.4375 13.6625 9.2625 17.4375C7.0875 21.2125 6 25.3 6 29.7C6 36.45 8.3625 42.1875 13.0875 46.9125C17.8125 51.6375 23.55 54 30.3 54Z"
        fill={fillValue}
      />
    </Svg>
  );
}

