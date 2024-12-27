import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicon from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { UnauthenticatedFetchError } from '@/common/api/utils';
import { useAuthMe } from '@/features/auth/use-auth';

export default function TabLayout() {
  const { isLoading, error } = useAuthMe({});

  if (isLoading) {
    return <ActivityIndicator />;
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
