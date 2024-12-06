import { ComponentProps, ReactNode } from 'react';
import { Pressable as BasePressable } from 'react-native';

export const Pressable = ({
  children,
  ...props
}: {
  children: ReactNode;
} & ComponentProps<typeof BasePressable>) => {
  return <BasePressable {...props}>{children}</BasePressable>;
};
