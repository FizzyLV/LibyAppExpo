import { useColorScheme } from '@/hooks/use-color-scheme';
import { GetUserData, UserDataInterface } from '@/utils/authUtility';
import { initializeDatabase } from '@/utils/databaseCreate';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [userDataState, setUserData] = useState<UserDataInterface | null>(null);
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
    const userData = GetUserData();
    const inAuthGroup = segments[0] === '(auth)';
    setUserData(userData);
    console.log('User data:', userData);
    if (!userData.token && !inAuthGroup) {
      // No token → go to login
      router.replace('/(auth)/Login');
    } else if (userData.token && inAuthGroup) {
      // Has token but on login screen → go to news
      router.replace('/(tabs)/News');
    }
  }, [segments, userDataState]);
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}