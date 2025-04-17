import { open } from 'sqlite';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

dotenv.config();

let unprocessedDbInstance = null;
let processedDbInstance = null;
let Predictions_DataDbInstance = null;

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

        if (!Predictions_DataDbInstance) {
            Predictions_DataDbInstance = await open({
                filename: process.env.Predictions_DATABASE_PATH, // Path to Processed Data.db
                driver: sqlite3.Database,
            });
            console.log('✅ Predictions Database Connected!');
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
    processedDbInstance, 
    Predictions_DataDbInstance
};