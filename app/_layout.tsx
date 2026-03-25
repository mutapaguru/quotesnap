import { Stack } from 'expo-router';
import { AuthProvider } from '@/lib/auth-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="invoices" />
        <Stack.Screen name="clients" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="pay" />
      </Stack>
    </AuthProvider>
  );
}
