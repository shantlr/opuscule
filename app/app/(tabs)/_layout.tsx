import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicon from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  console.log('TabLayout');
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
