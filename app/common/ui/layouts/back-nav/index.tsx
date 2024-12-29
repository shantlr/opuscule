import { Entypo } from '@expo/vector-icons';
import { Href, Link, useNavigation } from 'expo-router';
import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

export const BackNav = <Route extends object>({
  href,
  className,
  children,
  icon,
  ...props
}: {
  href: Href<Route>;
  className?: string;
  children?: ReactNode;
  icon?: ReactNode;
}) => {
  const { canGoBack, goBack } = useNavigation();

  return (
    <Link
      href={href}
      onPress={(event) => {
        if (canGoBack()) {
          event.preventDefault();
          event.stopPropagation();
          goBack();
        }
      }}
      asChild
    >
      {children ?? (
        <TouchableOpacity>
          {icon ?? (
            <Entypo
              size={30}
              name="chevron-left"
              className={className}
              {...props}
            />
          )}
        </TouchableOpacity>
      )}
    </Link>
  );
};
