import { Entypo } from '@expo/vector-icons';
import { Href, Link, useNavigation } from 'expo-router';
import { Text, View } from 'react-native';

export function MobileScreenHeader<Back extends object>({
  back,
  title,
}: {
  back?: Href<Back>;
  title: string;
}) {
  const { canGoBack, goBack } = useNavigation();
  return (
    <View className="flex flex-row h-[48px] shrink-0 items-center bg-secondarybg">
      {back && (
        <Link
          href={back}
          onPress={(event) => {
            if (canGoBack()) {
              event.preventDefault();
              event.stopPropagation();
              goBack();
            }
          }}
        >
          <View>
            <Entypo size={24} name="chevron-left" className="text-primary" />
          </View>
        </Link>
      )}
      <Text className="flex flex-row justify-center items-center text-lg text-primary">
        {title}
      </Text>
    </View>
  );
}
