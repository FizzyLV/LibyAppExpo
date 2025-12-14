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