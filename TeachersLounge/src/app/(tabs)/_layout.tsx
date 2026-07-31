import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TLColors } from '@/constants/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return <Ionicons name={name} size={24} color={focused ? TLColors.primary : '#aaa'} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TLColors.primary,
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { borderTopColor: '#f0f0f0', paddingTop: 8, paddingBottom: 8, height: 64 },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="threads"
        options={{
          title: 'Threads',
          tabBarIcon: ({ focused }) => <TabIcon name="reader-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon name="compass-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon name="library-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
