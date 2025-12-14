import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext';
import { registerAccount } from '../../utils/authUtility';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  
  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    
    try { 
        const result = await registerAccount({
        email: email,
        firstname: firstName,
        lastname: lastName,
        password: password,
        token: null,
        isAdmin: false
        });
        
        if (!result.success) {
        setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error) || 'Registration failed');
        return;
        }

        signIn(result.token);
        
    } catch (err: any) {
        setError(err.message ?? 'Unknown error');
    } finally {
        setLoading(false);
    }
    };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput 
        placeholder="First Name" 
        style={styles.input}
        placeholderTextColor="#999"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        selectionColor="#fff"
      />
      
      <TextInput 
        placeholder="Last Name" 
        style={styles.input}
        placeholderTextColor="#999"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        selectionColor="#fff"
      />
      
      <TextInput 
        placeholder="Email" 
        style={styles.input}
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        selectionColor="#fff"
      />
      
      <TextInput 
        placeholder="Password (min 8 characters)" 
        style={styles.input}
        secureTextEntry
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        selectionColor="#fff"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      {error ? (
        <View style={{ width: '100%', marginTop: 12 }}>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
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
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});