// import { open } from 'sqlite';
// import dotenv from 'dotenv';
// import sqlite3 from 'sqlite3';

// dotenv.config();

// let dbInstance = null;

// // Initialize SQLite connection
// const InitializeDatabase = async () => {
//     if (!dbInstance) {
//         try {
//             dbInstance = await open({
//                 filename: process.env.DATABASE_PATH,  // Path to your database file
//                 driver: sqlite3.Database  // Use the SQLite3 driver internally
//             });
//             console.log('✅ SQLite Database Connected!');
//         } catch (error) {
//             console.error('Error initializing database:', error.message);
//         }
//     }
//     return dbInstance;
// };

// // Open database when server starts (Only once)
// const startDatabase = async () => {
//     try {
//         await InitializeDatabase();
//     } catch (error) {
//         console.error('Error starting database:', error.message);
//     }
// };

// // Example of running a query without finalize
// const insertData = async () => {
//     const db = await InitializeDatabase();
//     await db.run('INSERT INTO your_table (column1, column2) VALUES (?, ?)', [value1, value2]);
// };

// // Export the database instance to use it in other parts of the app
// export { InitializeDatabase, startDatabase, dbInstance };


import { open } from 'sqlite';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

dotenv.config();

let unprocessedDbInstance = null;
let processedDbInstance = null;

// Initialize SQLite connections
const InitializeDatabases = async () => {
    try {
        if (!unprocessedDbInstance) {
            unprocessedDbInstance = await open({
                filename: process.env.UNPROCESSED_DATABASE_PATH, // Path to UnProcessed Data.db
                driver: sqlite3.Database,
            });
            console.log('✅ UnProcessed Database Connected!');
        }

        if (!processedDbInstance) {
            processedDbInstance = await open({
                filename: process.env.PROCESSED_DATABASE_PATH, // Path to Processed Data.db
                driver: sqlite3.Database,
            });
            console.log('✅ Processed Database Connected!');
        }
    } catch (error) {
        console.error('Error initializing databases:', error.message);
    }
};

// Open databases when server starts (Only once)
const startDatabases = async () => {
    try {
        await InitializeDatabases();
    } catch (error) {
        console.error('Error starting databases:', error.message);
    }
};

export {
    InitializeDatabases,
    startDatabases,
    unprocessedDbInstance,
    processedDbInstance
};