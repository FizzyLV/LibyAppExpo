import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { editNewsPost, getNewsItemById } from '../../utils/newsItemUtil';

export default function EditNewsScreen() {
  const params = useLocalSearchParams();
  const newsId = params.id as string;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalImagePath, setOriginalImagePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNewsItem();
  }, [newsId]);

  const loadNewsItem = () => {
    setInitialLoading(true);
    const newsItem = getNewsItemById(newsId);
    
    if (newsItem) {
      setTitle(newsItem.title || '');
      setDescription(newsItem.description || '');
      setOriginalImagePath(newsItem.localImagePath || '');
    } else {
      Alert.alert('Error', 'Failed to load news item', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    
    setInitialLoading(false);
  };

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
    
    setLoading(true);
    
    const result = await editNewsPost(newsId, title, description, imageUri);
    
    setLoading(false);
    
    if (result.success) {
      Alert.alert('Success', 'News post updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update post');
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  // Show the new image if selected, otherwise show the original local path
  const displayImageUri = imageUri || originalImagePath;

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
          {imageUri ? 'Change Image' : 'Upload New Image'}
        </Text>
      </TouchableOpacity>

      {displayImageUri && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: displayImageUri }} style={styles.image} />
          {imageUri && (
            <Text style={styles.imageLabel}>New Image Selected</Text>
          )}
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
          <Text style={styles.buttonText}>Update Post</Text>
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
  imageLabel: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 123, 255, 0.8)',
    color: '#fff',
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
});