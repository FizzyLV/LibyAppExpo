import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import storage from 'expo-sqlite/kv-store';
import { newsItemInterface as NewsItem } from '../models/newsItem';
import { getDatabase } from './databaseCreate';

export const getLastNewsItemId = (db: SQLite.SQLiteDatabase): number => {
    const row = db.getFirstSync<{ id: number }>(`SELECT id FROM newsItems ORDER BY id DESC LIMIT 1`);
    return row?.id ?? 0;
}

export async function fetchNewsItems(): Promise<NewsItem[]> { 
    const token = storage.getItemSync('token');
    const db = getDatabase();
    const lastId = getLastNewsItemId(db);
    console.log("Last ID:", lastId);
    try {
        const response = await fetch('http://192.168.0.110:8000/api/token/news/', {
            method: 'GET',
            headers: {
                'authorization': token ?? '',
                'lastId': lastId.toString(),
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
    
    if (!newsItemExists(db, item)) {
        // Download image if URL is provided
        let localImagePath = item.localImagePath;
        
        if (item.imageUrl) {
            localImagePath = await downloadImage(item.imageUrl, item.id);
        }
        
        // Insert into database
        db.runSync(
            `INSERT INTO newsItems (id, localImagePath, authorName, title, description, publishedAt, email)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id, 
                localImagePath ?? null, 
                item.authorName ?? null, 
                item.title ?? null, 
                item.description ?? null, 
                item.publishedAt ?? null, 
                item.email ?? null
            ]
        );
        console.log(`Saved news item: ${item.id}`);
    }
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
        
        const response = await fetch('http://192.168.0.110:8000/api/token/addnews/', {
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
        const response = await fetch(`http://192.168.0.110:8000/api/token/deletenews/${id}/`, {
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