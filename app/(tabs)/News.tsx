import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
  id: number;
  name: string;
  last_name: string;
  email: string;
  password: string;
  token: string;
}

export default function NewsScreen() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const db = await SQLite.openDatabaseAsync('LibyApp.db');
        const result = await db.getAllAsync('SELECT * FROM users;');
        setUsers(result as User[]);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    
    fetchUsers();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {users.map((user) => (
        <Text key={user.id} style={styles.text}>
          {user.name}
        </Text>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
  },
});