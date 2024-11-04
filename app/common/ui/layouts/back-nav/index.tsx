import { Entypo } from '@expo/vector-icons';
import { Href, Link, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export const BackNav = <Route extends object>({
  href,
  className,
  ...props
}: {
  href: Href<Route>;
  className?: string;
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
      <TouchableOpacity>
        <Entypo
          size={30}
          name="chevron-left"
          className={className}
          {...props}
        />
      </TouchableOpacity>
    </Link>
  );
};
