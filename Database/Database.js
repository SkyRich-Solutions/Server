import { open } from 'sqlite';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

dotenv.config();

let dbInstance = null;

// Initialize SQLite connection
const InitializeDatabase = async () => {
    if (!dbInstance) {
        try {
            dbInstance = await open({
                filename: process.env.DATABASE_PATH,  // Path to your database file
                driver: sqlite3.Database  // Use the SQLite3 driver internally
            });
            console.log('✅ SQLite Database Connected!');
        } catch (error) {
            console.error('Error initializing database:', error.message);
        }
    }
    return dbInstance;
};

// Open database when server starts (Only once)
const startDatabase = async () => {
    try {
        await InitializeDatabase();
    } catch (error) {
        console.error('Error starting database:', error.message);
    }
};

// Example of running a query without finalize
const insertData = async () => {
    const db = await InitializeDatabase();
    await db.run('INSERT INTO your_table (column1, column2) VALUES (?, ?)', [value1, value2]);
};

// Export the database instance to use it in other parts of the app
export { InitializeDatabase, startDatabase, dbInstance };
