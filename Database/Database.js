import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SQLite connection
const InitializeDatabase = async () => {
    const Database = await open({
        filename: process.env.DATAABSE_PATH,
        driver: sqlite3.Database
    });

    console.log('✅ SQLite Database Connected!');

    try {
        const tables = await Database.all(
            "SELECT name FROM sqlite_master WHERE type='table'"
        );
        console.log(
            '📂 Tables in the database:',
            tables.map((t) => t.name)
        );

        console.log(
            '📂 Tables in the database:',
            tables.map((t) => t.name)
        );

        // Get column names for each table
        for (const table of tables) {
            const columns = await Database.all(
                `PRAGMA table_info(${table.name})`
            );
            console.log(
                `🛠️ Columns in '${table.name}':`,
                columns.map((col) => col.name)
            );
        }
    } catch (err) {
        console.error('❌ Error managing tables:', err);
    }

    Database.get;
    return Database;
};

// Export database connection
const Database = await InitializeDatabase();
export default Database;
