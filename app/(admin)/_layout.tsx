import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#007BFF',
        headerTitleStyle: { color: '#FFFFFF' },
        contentStyle: { backgroundColor: '#000000' }
        
      }}
    >
      <Stack.Screen 
        name="addNews" 
        options={{ title: 'Add News', headerTitleAlign: 'center' }}
      />
      <Stack.Screen
        name="editNews"
        options={{ title: 'Edit News', headerTitleAlign: 'center' }}
      />
    </Stack>
  );
}