import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function resetDatabase() {
  return recreateTables();
}

export function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = SQLite.openDatabaseSync('LibyApp.db');
    console.log('Database created and initialized');

    // Create table WITHOUT AUTOINCREMENT - uses server IDs directly
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS newsItems (
        id INTEGER PRIMARY KEY NOT NULL, 
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

// Drop and recreate tables
export function recreateTables() {
  const db = getDatabase();
  
  try {
    // Drop existing table
    db.execSync(`DROP TABLE IF EXISTS newsItems;`);
    
    // Recreate with correct schema (no autoincrement)
    db.execSync(`
      CREATE TABLE newsItems (
        id INTEGER PRIMARY KEY NOT NULL, 
        localImagePath TEXT,
        authorName TEXT,
        title TEXT,
        description TEXT,
        publishedAt TEXT,
        email TEXT
      );
    `);
    
    console.log('Tables recreated successfully');
    return db;
  } catch (error) {
    console.error('Table recreation error:', error);
    throw error;
  }
}