import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SavedResourcesProvider } from '@/context/SavedResourcesContext';

export default function RootLayout() {
  return (
    <SavedResourcesProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SavedResourcesProvider>
  );
}
