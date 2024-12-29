import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import GoogleSignIn from '@/features/auth/ui-google-sign-in';
import { useAuthConfig, useAuthMe } from '@/features/auth/use-auth';

export default function SignIn() {
  const { data, error } = useAuthMe({
    params: {},
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: authConfig, isLoading: isLoadingAuthConfig } = useAuthConfig(
    {},
  );

  if (data?.user && !error) {
    return <Redirect href="/(tabs)" />;
  }

  if (isLoadingAuthConfig) {
    return (
      <View className="w-full h-full flex justify-center items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="p-4 flex flex-col items-center">
      <Text className="text-center mt-12">Sign in</Text>
      <View className="mt-[10%] max-w-[300px]">
        {!!authConfig?.google && (
          <GoogleSignIn
            clientId={authConfig.google.client_id}
            redirectUrl={authConfig.google.redirect_url}
          />
        )}
      </View>
    </ScrollView>
  );
}
