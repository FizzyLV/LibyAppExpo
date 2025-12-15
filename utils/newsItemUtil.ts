import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import storage from 'expo-sqlite/kv-store';
import { newsItemInterface as NewsItem } from '../models/newsItem';
import { getDatabase } from './databaseCreate';

export const getLastModifiedTimestamp = (db: SQLite.SQLiteDatabase): number => {
    const row = db.getFirstSync<{ lastModifiedAt: number }>(`SELECT lastModifiedAt FROM newsItems ORDER BY lastModifiedAt DESC LIMIT 1`);
    return row?.lastModifiedAt ?? 0;
}

export async function fetchNewsItems(): Promise<NewsItem[]> { 
    const token = storage.getItemSync('token');
    const db = getDatabase();
    const lastModified = getLastModifiedTimestamp(db);
    console.log("Last Modified:", lastModified);
    try {
        const response = await fetch('http://192.168.1.96:2134/api/token/news/', {
            method: 'GET',
            headers: {
                'authorization': token ?? '',
                'lastModified': lastModified.toString(),
            }
        });

        if (!response.ok) {
            console.log("API error:", response.status, "- Loading from local database");
            return getLocalNewsItems();
        }

        const { news } = await response.json();
        console.log("API response:", news);
        
        if (!news || news.length === 0) {
            return getLocalNewsItems();
        }

        // Process each news item
        for (const item of news) {
            await processAndSaveNewsItem(item);
        }
        
        return getAllNewsItems(db);
    } catch (error) {
        console.error("Network error or fetch failed:", error);
        console.log("Loading news from local database");
        return getLocalNewsItems();
    }
}

async function processAndSaveNewsItem(item: any): Promise<void> {
    const db = getDatabase();
    
    // Check if news item exists
    if (newsItemExists(db, item)) {
        // Update existing item
        let localImagePath = getExistingImagePath(db, item.id);
        
        // Download new image if URL changed
        if (item.imageUrl) {
            localImagePath = await downloadImage(item.imageUrl, item.id);
        }
        
        db.runSync(
            `UPDATE newsItems 
            SET localImagePath = ?, authorName = ?, title = ?, description = ?, publishedAt = ?, email = ?, lastModifiedAt = ?
            WHERE id = ?`,
            [
                localImagePath ?? null,
                item.authorName ?? null,
                item.title ?? null,
                item.description ?? null,
                item.publishedAt ?? null,
                item.email ?? null,
                item.lastModifiedAt ?? null,
                item.id
            ]
        );
        console.log(`Updated news item: ${item.id}`);
    } else {
        // Insert new item
        let localImagePath = item.localImagePath;
        
        if (item.imageUrl) {
            localImagePath = await downloadImage(item.imageUrl, item.id);
        }
        
        db.runSync(
            `INSERT INTO newsItems (id, localImagePath, authorName, title, description, publishedAt, email, lastModifiedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id,
                localImagePath ?? null,
                item.authorName ?? null,
                item.title ?? null,
                item.description ?? null,
                item.publishedAt ?? null,
                item.email ?? null,
                item.lastModifiedAt ?? null
            ]
        );
        console.log(`Saved news item: ${item.id}`);
    }
}

function getExistingImagePath(db: SQLite.SQLiteDatabase, newsId: number): string | null {
    const row = db.getFirstSync<{ localImagePath: string }>(
        `SELECT localImagePath FROM newsItems WHERE id = ?`,
        [newsId]
    );
    return row?.localImagePath ?? null;
}

async function downloadImage(imageUrl: string, newsId: number): Promise<string | null> {
    try {
        const imageDir = new Directory(Paths.cache, 'news_images');
        
        if (!imageDir.exists) {
            imageDir.create();
        }
        
        const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
        const imageFile = new File(imageDir, `${newsId}.${extension}`);
        
        if (imageFile.exists) {
            console.log(`Image already exists: ${imageFile.uri}`);
            return imageFile.uri;
        }
        
        const downloadedFile = await File.downloadFileAsync(imageUrl, imageFile, { idempotent: true });
        
        if (downloadedFile.exists) {
            console.log(`Image downloaded: ${downloadedFile.uri}`);
            return downloadedFile.uri;
        } else {
            console.log(`Failed to download image`);
            return null;
        }
    } catch (error) {
        console.error('Error downloading image:', error);
        return null;
    }
}

function newsItemExists(
    db: SQLite.SQLiteDatabase,
    newsItem: any
): boolean {
    const row = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM newsItems WHERE id = ?`,
        [newsItem.id]
    );
    if (!row) {
        return false;
    }
    return (row.count > 0);
}

function getAllNewsItems(db: SQLite.SQLiteDatabase): NewsItem[] {
    const rows = db.getAllSync<NewsItem>(
        `SELECT * FROM newsItems ORDER BY publishedAt DESC`
    );
    return rows ?? [];
}

// Function to get news items from local database only
export function getLocalNewsItems(): NewsItem[] {
    const db = getDatabase();
    return getAllNewsItems(db);
}   

export async function createNewsPost(title: string, description: string, imageUri: string) {
    const token = storage.getItemSync('token');
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        
        // Add image file
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
            uri: imageUri,
            name: filename,
            type: type,
        } as any);
        
        const response = await fetch('http://192.168.1.96:2134/api/token/addnews/', {
            method: 'POST',
            headers: {
                'authorization': token ?? '',
            },
            body: formData,
        });
        
        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                error: error.detail || 'Failed to create news post'
            };
        }
        
        const data = await response.json();
        console.log('News post created:', data);
        
        return {
            success: true,
            newsItem: data.newsItem
        };
        
    } catch (error) {
        console.error('Error creating news post:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function deleteNewsItemLocal(id: number) {
    const db = getDatabase();
    db.runSync(
        `DELETE FROM newsItems WHERE id = ?`,
        [id]
    );
}

export async function deleteNewsItem(id: number) {
    const token = storage.getItemSync('token');
    try {
        const response = await fetch(`http://192.168.1.96:2134/api/token/deletenews/${id}/`, {
            method: 'DELETE',
            headers: {
                'authorization': token ?? '',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return {
                success: false,
                error: error.detail || 'Failed to delete news item'
            };
        }

        const data = await response.json();

        console.log('News item deleted:', data);
        await deleteNewsItemLocal(id);
        return {
            success: true,
            message: data.message
        };

    } catch (error) {
        console.error('Error deleting news item:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export function getNewsItemById(newsId: string | number): NewsItem | null {
  const db = getDatabase();
  
  const row = db.getFirstSync<NewsItem>(
    `SELECT * FROM newsItems WHERE id = ?`,
    [typeof newsId === 'string' ? parseInt(newsId) : newsId]
  );
  
  return row ?? null;
}

export async function editNewsPost(
  newsId: string,
  title: string,
  description: string,
  imageUri: string | null
) {
  const token = storage.getItemSync('token');
  
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    
    // Only add image if a new one was selected
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
    }
    
    console.log('Sending request to edit news:', newsId);
    
    const response = await fetch(`http://192.168.1.96:2134/api/token/editnews/${newsId}/`, {
      method: 'POST',
      headers: {
        'authorization': token ?? '',
      },
      body: formData,
    });
    
    console.log('Response status:', response.status);
    
    // Get the response text first
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Server returned non-JSON response:', responseText);
      return {
        success: false,
        error: `Server error: Expected JSON but got ${contentType || 'unknown type'}`
      };
    }
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Failed to update news post'
      };
    }
    
    console.log('News post updated:', data);
    
    return {
      success: true,
    };
    
  } catch (error) {
    console.error('Error updating news post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}