import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootNavigator() {
  const { token, isLoading, needsBiometric } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }
    if (needsBiometric) {
      router.replace('/unlock');
      return;
    }
    router.replace('/(tabs)');
  }, [isLoading, token, needsBiometric, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="unlock" />
        <Stack.Screen name="book" options={{ presentation: 'card' }} />
        <Stack.Screen name="scan" />
        <Stack.Screen name="search" />
        <Stack.Screen name="add-book" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Editar perfil' }} />
        <Stack.Screen name="recommendations" options={{ title: 'Recomendaciones IA' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function Layout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
