import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDatabase } from '@/utils/databaseCreate';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/authContext';

function RootNavigator() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize database once - singleton pattern handles reuse
  const db = initializeDatabase();
  useDrizzleStudio(db);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/Login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/News');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <Stack screenOptions={{
          animation: 'none',
          contentStyle: { backgroundColor: '#000000' }
        }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
      <StatusBar style="light" />
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