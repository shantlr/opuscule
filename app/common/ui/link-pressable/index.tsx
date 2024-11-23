import { Href, Link } from 'expo-router';
import { MouseEvent, ReactNode } from 'react';
import { GestureResponderEvent, TouchableOpacity } from 'react-native';

export function LinkPressable<T extends string | object>({
  href,
  children,
  className,
  onPress,
}: {
  href: Href<T>;
  className?: string;
  children: ReactNode;
  onPress?: (e: MouseEvent | GestureResponderEvent) => void;
}) {
  return (
    <Link href={href} asChild onPress={onPress}>
      <TouchableOpacity className={className}>{children}</TouchableOpacity>
    </Link>
  );
}
