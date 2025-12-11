import * as SQLite from 'expo-sqlite';

export function initializeDatabase() {
  try {
    // Use openDatabaseSync instead of openDatabaseAsync
    const db = SQLite.openDatabaseSync('LibyApp.db');
    
    console.log('Database created and initialized');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}