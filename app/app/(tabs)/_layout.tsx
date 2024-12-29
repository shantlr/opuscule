import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicon from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';

import {
  FailedToFetchError,
  UnauthenticatedFetchError,
} from '@/common/api/utils';
import { Button } from '@/common/ui/button';
import { ErrorStatusBar } from '@/common/ui/error-status-bar';
import { LoadingScreen } from '@/common/ui/loading-screen';
import { useAuthMe } from '@/features/auth/use-auth';

export default function TabLayout() {
  const { data, isLoading, error, refetch } = useAuthMe({});

  if (isLoading && !error && !data) {
    return <LoadingScreen />;
  }

  if (!data && error instanceof FailedToFetchError) {
    return (
      <View>
        <ErrorStatusBar>API Unreachable</ErrorStatusBar>
        <View className="w-full items-center">
          <Button
            className="top-4"
            variant="accent"
            onPress={() => {
              refetch();
            }}
          >
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (error instanceof UnauthenticatedFetchError) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarActiveTintColor: '#818cf8' }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booked"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <Ionicon size={28} name="bookmark-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
