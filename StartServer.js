import app from './Config/app.js'; // Import Express app
import dotenv from 'dotenv';
import http from 'http';
import { InitializeSocket } from './Sockets/InitializeSocket.js';
import { startDatabases } from './Database/Database.js';

dotenv.config(); // Load environment variables

const PORT = process.env.PORT;

// Start the server
const startServer = async () => {
    const server = http.createServer(app); // Create HTTP server with Express

    await startDatabases().then(() => {
        InitializeSocket(server); // Initialize WebSocket

        server.listen(PORT, () => {
            console.log(`🚀 Socket Server is running on Port ${PORT}`);
        });
    });
};

startServer(); // Start server automatically

export default startServer;
