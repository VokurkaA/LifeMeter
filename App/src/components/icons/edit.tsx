import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height' | 'fill'> & {
  size?: number; // fallback if no className sizing provided
  className?: string; // Tailwind classes (e.g., "h-6 w-6 text-foreground")
  fill?: string; // optional explicit fill color (overrides currentColor)
};

export default function EditIcon({ size = 24, className, fill, ...rest }: Props) {
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
        d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"
      />
    </Svg>
  );
}
