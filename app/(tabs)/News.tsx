import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import storage from 'expo-sqlite/kv-store';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { newsItemInterface as NewsItem } from '../../models/newsItem';
import { deleteNewsItem, fetchNewsItems } from '../../utils/newsItemUtil';

export default function NewsScreen() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastOpacity] = useState(new Animated.Value(0));
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const isAdmin = storage.getItemSync('isAdmin') === 'true';

  const loadNews = useCallback(async () => {
    setRefreshing(true);
    const items = await fetchNewsItems();
    setNewsItems(items);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNews();
    }, [loadNews])
  );


  const showAdminToast = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
  };

  const handleAddPress = () => {
    if (!isAdmin) {
      showAdminToast();
      return;
    }
    router.push('/(admin)/addNews');
  };

  const formatTimeAgo = (unixTimestamp: number) => {
    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Published just now.';
    if (seconds < 3600) return `Published ${Math.floor(seconds / 60)} minutes ago.`;
    if (seconds < 86400) return `Published ${Math.floor(seconds / 3600)}h ago.`;
    return `Published ${Math.floor(seconds / 86400)}d ago.`;
  };

  const handleCardPress = (item: NewsItem) => {
    if (!isAdmin) {
      showAdminToast()
      return;
    }
    
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleEdit = () => {
    if (!selectedItem) return;
    
    router.push({
      pathname: '/(admin)/editNews',
      params: { id: selectedItem.id }
    });
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    await deleteNewsItem(selectedItem.id);
    loadNews();
    setShowEditModal(false);
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7} 
      onPress={() => handleCardPress(item)}
    >
      {item.localImagePath ? (
        <Image 
          source={{ uri: item.localImagePath }}
          style={styles.image}
          resizeMode="cover"
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}          
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.authorContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.authorName.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{item.authorName}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.publishedAt)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={handleAddPress} 
            style={styles.headerButton}
          >
            <Ionicons 
              name="add-circle" 
              size={24} 
              color={isAdmin ? "#007BFF" : "#666666"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={loadNews} 
            style={styles.headerButton}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? "#666666" : "#007BFF"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="lock-closed" size={48} color="#FFF" />
          <Text style={styles.toastText}>Admin access required to manage posts</Text>
        </Animated.View>
      )}
      {showEditModal && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        />
      )}
      {showEditModal && selectedItem && (
        <View style={styles.editModal}>
          <Text style={styles.modalTitle}>Edit Post</Text>
          <Text style={styles.modalSubtitle} numberOfLines={2}>
            {selectedItem.title}
          </Text>
          
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={24} color="#007BFF" />
            <Text style={styles.modalButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.deleteButton]} 
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#DC3545" />
            <Text style={[styles.modalButtonText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={newsItems}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No news items available.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    zIndex: 999,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    right: 12,
    paddingTop: 24,
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  toast: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    height: 200,
    backgroundColor: '#DC3545',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  editModal: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
    width: 300,
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  modalButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#2C2C2E',
  },
  deleteText: {
    color: '#DC3545',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666666',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#2C2C2E',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666666',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#A0A0A0',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C6F6F',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
  },
});