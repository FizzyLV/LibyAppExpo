import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext';
import { SaveUserData } from '../../utils/authUtility';

export default function AccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  
  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    
    try { 
      const res = await fetch('http://192.168.0.110:8000/api/token/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      if (!res.ok) {
        try {
          const parsed = JSON.parse(text);
          setError(JSON.stringify(parsed));
        } catch (_) {
          setError(text || `Server returned ${res.status}`);
        }
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = text;
      }

      const receivedToken = data?.token ?? data?.access ?? (typeof data === 'string' ? data : null);
      if (!receivedToken) {
        setError('No token returned from server');
        return;
      }

      const tokenString = typeof receivedToken === 'string' ? receivedToken : JSON.stringify(receivedToken);
      const firstName = data?.firstName ?? '';
      const lastName = data?.lastName ?? '';

      // Save to storage
      SaveUserData(firstName, lastName, email, password, tokenString);
      
      // Update context - this will trigger navigation in _layout.tsx
      signIn(tokenString);
      
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
        placeholder="Password" 
        style={styles.input}
        secureTextEntry
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        selectionColor="#fff"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});