// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';
// import dotenv from 'dotenv';

// dotenv.config();

// // Initialize SQLite connection
// const InitializeDatabase = async () => {
//     const Database = await open({
//         filename: process.env.DATAABSE_PATH,
//         driver: sqlite3.Database
//     });

//     console.log('✅ SQLite Database Connected!');
// };

// // Export database connection
// const Database = await InitializeDatabase();
// export default Database;

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance = null;

// Initialize SQLite connection
const InitializeDatabase = async () => {
    if (!dbInstance) {
        dbInstance = await open({
            filename: process.env.DATABASE_PATH,
            driver: sqlite3.Database
        });
        console.log('✅ SQLite Database Connected!');
    }
    return dbInstance;
};

// Open database when server starts (Only once)
const startDatabase = async () => {
    try {
        await InitializeDatabase();
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
};

// Export the database instance to use it in other parts of the app
export { InitializeDatabase, startDatabase, dbInstance };
