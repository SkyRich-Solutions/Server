import express from 'express';
import dotenv from 'dotenv';
import corsMiddleware from './cors.js';
import Database from '../Database/Database.js';

dotenv.config();

// Create Express App
const app = express();

// Use CORS Middleware
app.use(corsMiddleware);

// JSON Parsing Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Server is Running ...' });
});

app.get('/users', async (req, res) => {
    const users = await Database.all('SELECT * FROM users');
    res.json(users);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message
    });
});

export default app; // Export app (without starting the server)
