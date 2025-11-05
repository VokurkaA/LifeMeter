import { cssInterop } from 'nativewind';
import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

cssInterop(Svg, { className: 'style' });

type Props = Omit<SvgProps, 'width' | 'height' | 'fill'> & {
  size?: number; // fallback if no className sizing provided
  className?: string; // Tailwind classes (e.g., "h-6 w-6 text-foreground")
  fill?: string; // optional explicit fill color (overrides currentColor)
};

export default function DeleteIcon({ size = 24, className, fill, ...rest }: Props) {
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
        d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
      />
    </Svg>
  );
}
