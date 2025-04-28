import express from 'express';
import dotenv from 'dotenv';
import corsMiddleware from './cors.js';
import routes from '../Routes/routes.js';

dotenv.config();

// Create Express App
const app = express();

// Use CORS Middleware
app.use(corsMiddleware);

// JSON Parsing Middleware
app.use(express.json({ limit: '50mb' }));

// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
    res.send('🚀 Express Server Running!');
});

app.use('/api', routes);

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
