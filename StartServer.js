import app from './Config/app.js'; // Import Express app
import dotenv from 'dotenv';
import http from 'http';
import { startDatabases } from './Database/Database.js';

dotenv.config(); // Load environment variables

const PORT = process.env.PORT;

// Add health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'API is running smoothly'
    });
});

// Start the server
const startServer = async () => {
    const server = http.createServer(app); // Create HTTP server with Express

    await startDatabases().then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on Port ${PORT}`);
        });
    });
};

startServer(); // Start server automatically

export default startServer;
