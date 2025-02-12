import app from './Config/app.js'; // Import Express app
import dotenv from 'dotenv';
import http from 'http';
import { InitializeSocket } from './Sockets/InitializeSocket.js';

dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 3000;

// Start the server
const startServer = () => {
    const server = http.createServer(app); // Create HTTP server with Express
    InitializeSocket(server); // Initialize WebSocket
    server.listen(PORT, () => {
        console.log(`🚀 Socket Server is running on Port ${PORT}`);
    });
};

startServer(); // Start server automatically

export default startServer;
