import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { newsItemInterface as NewsItem } from '../../models/newsItem';
import { fetchNewsItems } from '../../utils/newsItemUtil';

export default function NewsScreen() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadNews = async () => {
    setRefreshing(true);
    const items = await fetchNewsItems();
    setNewsItems(items);
    setLoading(false);
    setRefreshing(false);
  };
  
  useEffect(() => {
    loadNews(); 
  }, []);

  const formatTimeAgo = (unixTimestamp: number) => {
    // Convert seconds to milliseconds
    const date = new Date(unixTimestamp * 1000);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Published just now.';
    if (seconds < 3600) return `Published ${Math.floor(seconds / 60)} minutes ago.`;
    if (seconds < 86400) return `Published ${Math.floor(seconds / 3600)}h ago.`;
    return `Published ${Math.floor(seconds / 86400)}d ago.`;
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
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
        <TouchableOpacity 
          onPress={loadNews} 
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#666666" : "#007BFF"} 
          />
        </TouchableOpacity>
      </View>
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
  refreshButton: {
    padding: 8,
    paddingTop: 24,
    position: 'absolute',
    right: 20,
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
    paddingTop: 100,
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
  },
});