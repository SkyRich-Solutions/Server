import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import corsMiddleware from './Config/cors.js';
import routes from './Routes/routes.js';
import startServer from './Config/StartServer.js';

dotenv.config();

// Database Connection
mongoose
    .connect(process.env.MONGO_DB_API)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log('Error : ', err);
    });

// Creating an Express Server
const app = express();

// Use CORS Middleware
app.use(corsMiddleware);

// JSON Parsing Middleware
app.use(express.json());

// Authentication Middleware
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Server is Running ...'
    });
});

app.use('', routes);

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

// Start the server

export default app;
startServer();