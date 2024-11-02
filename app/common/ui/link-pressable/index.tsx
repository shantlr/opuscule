import { Href, Link } from 'expo-router';
import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

export function LinkPressable<T extends string | object>({
  href,
  children,
  className,
}: {
  href: Href<T>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} asChild>
      <TouchableOpacity className={className}>{children}</TouchableOpacity>
    </Link>
  );
}
