import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDatabase } from '@/utils/databaseCreate';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/authContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  const db = useMemo(() => {
    try {
      return initializeDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
      return null;
    }
  }, []);
  
  useDrizzleStudio(db);

  useEffect(() => {
    if (isLoading) return; // Don't navigate while loading

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/Login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/News');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'none'}} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none'}} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}