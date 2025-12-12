import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

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