import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDatabase } from '@/utils/databaseCreate';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Initialize once with useMemo
  const db = useMemo(() => {
    try {
      return initializeDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
      return null;
    }
  }, []);
  
  useDrizzleStudio(db);
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}