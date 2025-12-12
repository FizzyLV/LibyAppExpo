import storage from 'expo-sqlite/kv-store';
import { newsItemInterface as NewsItem } from '../models/newsItem';


export async function fetchNewsItems(): Promise<NewsItem[]> { 
    const token = storage.getItemSync('token');

    const response = await fetch('http://192.168.0.110:8000/api/token/news/', {
        method: 'GET',
        headers: {
            'Authorization': token ?? ''
        }
    });

    if (!response.ok) {
        console.log("API error:", response.status);
        return [];
    }

    const { news } = await response.json();
    console.log("API response:", news); 
    return news ?? [];
}
