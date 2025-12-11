import * as SQLite from 'expo-sqlite';

export function initializeDatabase() {
  try {
    // Use openDatabaseSync instead of openDatabaseAsync
    const db = SQLite.openDatabaseSync('LibyApp.db');
    
    // Use execSync instead of execAsync
    db.execSync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        last_name TEXT,
        email TEXT,
        password TEXT,
        token TEXT
      );
    `);
    
    db.execSync('DELETE FROM users;');
    
    console.log('Database created and initialized');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}