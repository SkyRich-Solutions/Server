import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SQLite connection
const initDB = async () => {
    const Database = await open({
        filename: process.env.DATAABSE_PATH,
        driver: sqlite3.Database
    });

    // Create tables if not exists
    await Database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);

    console.log('✅ SQLite Database Connected!');
    return Database;
};

// Export database connection
const Database = await initDB();
export default Database;
