import { Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext';
import { deleteAccount, GetUserData, logOut } from '../../utils/authUtility';
import { resetDatabase } from '../../utils/databaseCreate';
export default function SettingsScreen() {
  const { signOut } = useAuth();
  const userData = GetUserData();

  const handleLogout = async () => { 
    await logOut()
    signOut(); // THEN trigger navigation
  };
  const handleAccountDeletion = async () => {  
    await deleteAccount();
    signOut(); 
  };



  return (
    <SafeAreaView style={styles.container}>
      <TextInput 
        style={styles.input}
        value={`Email: ${userData?.email || ''}`}
        autoCapitalize="none"
        editable={false}
        keyboardType="email-address"
        selectionColor="#fff"
        
      />
      <TextInput 
        style={styles.input}
        value={`Name: ${userData?.firstname || ''}  Last Name: ${userData?.lastname || ''}`}
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
      <Button
        title="Delete Account"
        onPress={handleAccountDeletion}
      />
      <Button
        title="Delete DB"
        onPress={resetDatabase}
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
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: '#fff',
  },
});