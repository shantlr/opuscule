import { Href, Link } from 'expo-router';
import { ReactNode } from 'react';
import { View } from 'react-native';

export function LinkPressable<T extends string | object>({
  href,
  children,
  className,
}: {
  href: Href<T>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} asChild>
      <View className={className}>{children}</View>
    </Link>
  );
}
