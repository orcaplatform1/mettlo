import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/tokens';

type Variant = keyof typeof Typography;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  style?: TextStyle | TextStyle[];
}

export function MettloText({ variant = 'body', color, style, ...props }: Props) {
  return (
    <Text
      style={[Typography[variant], { color: color ?? Colors.textPrimary }, style]}
      {...props}
    />
  );
}
