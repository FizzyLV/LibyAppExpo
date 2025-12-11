import { ClearUserData, GetUserData, UserDataInterface } from '@/utils/authUtility';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function SettingsScreen() {
  const [userDataState, setUserData] = useState<UserDataInterface | null>(null);

  useEffect(() => {
    const userData = GetUserData();
    setUserData(userData);
    console.log(userData); // Changed from userDataState (it's still null here)
  }, [])

  const handleLogout = () => {
      ClearUserData();
  };

  return (
    <SafeAreaView style={styles.container}>
       <TextInput 
              style={styles.input}
              value={`Email: ${userDataState?.email || ''}`}
              autoCapitalize="none"
              editable={false}
              keyboardType="email-address"
              selectionColor="#fff"
            />
        <TextInput 
              style={styles.input}
              value={`Name: ${userDataState?.firstname || ''}  Last Name: ${userDataState?.lastname || ''}`}
              autoCapitalize="none"
              editable={false}
              keyboardType="email-address"
              selectionColor="#fff"
            />
        <TextInput 
                placeholder="Password" 
                style={styles.input}
                secureTextEntry
                placeholderTextColor="#999"
                value={'***************'}
                editable={false}
                selectionColor="#fff"
        />
        <Button
          title="Logout"
          onPress={handleLogout}
        />
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
    input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: '#fff',
  },
  TextInput: {
    color: '#FFFFFF',
  },
});