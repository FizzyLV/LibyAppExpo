import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function resetDatabase() {
  try {
    // Close the database if it's open
    if (dbInstance) {
      dbInstance.closeSync();
      dbInstance = null;
    }

    // Delete the database file
    const dbFile = new File(Paths.document, 'SQLite', 'LibyApp.db');
    if (dbFile.exists) {
      dbFile.delete();
      console.log('Database file deleted successfully');
    }

    // Reinitialize
    return initializeDatabase();
  } catch (error) {
    console.error('Database reset error:', error);
    throw error;
  }
}

export function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = SQLite.openDatabaseSync('LibyApp.db');
    console.log('Database created and initialized');

    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS newsItems (
        id INTEGER PRIMARY KEY, 
        localImagePath TEXT,
        authorName TEXT,
        title TEXT,
        description TEXT,
        publishedAt TEXT,
        email TEXT
      );
    `);

    console.log('Tables created successfully');

    return dbInstance;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!dbInstance) {
    return initializeDatabase();
  }
  return dbInstance;
}

// Alternative: Drop and recreate the table without deleting the file
export function recreateTables() {
  const db = getDatabase();
  
  try {
    // Drop existing table
    db.execSync(`DROP TABLE IF EXISTS newsItems;`);
    
    // Recreate with correct schema
    db.execSync(`
      CREATE TABLE newsItems (
        id INTEGER PRIMARY KEY, 
        localImagePath TEXT,
        authorName TEXT,
        title TEXT,
        description TEXT,
        publishedAt TEXT,
        email TEXT
      );
    `);
    
    console.log('Tables recreated successfully');
  } catch (error) {
    console.error('Table recreation error:', error);
    throw error;
  }
}