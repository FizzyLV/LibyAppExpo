import { createNewsPost } from '@/utils/newsItemUtil';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddNewsScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }
    
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }
    
    setLoading(true);
    
    const result = await createNewsPost(title, description, imageUri);
    
    setLoading(false);
    
    if (result.success) {
      Alert.alert('Success', 'News post created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to create post');
    }
  };

  return (
    <SafeAreaView style={styles.container}>      
      <TextInput
        placeholder="News Item Title" 
        style={styles.input}
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
      />
      
      <TextInput
        placeholder="News Item Description" 
        style={[styles.input, styles.textArea]}
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>
          {imageUri ? 'Change Image' : 'Upload Image'}
        </Text>
      </TouchableOpacity>

      {imageUri && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.submitButton]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Post</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'flex-start',
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
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlign: 'left',
    paddingTop: 10,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: '#28A745',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '100%',
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
});