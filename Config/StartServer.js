import app from '../index.js';
import dotenv from 'dotenv';
import http from 'http';
import { InitializeSocket } from '../Sockets/InitializeSocket.js';

dotenv.config(); // Load environment variables

const PORT = process.env.PORT;

// Start the server
const startServer = () => {
    const server = http.createServer(app);
    InitializeSocket(server);
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} :)`);
    });
};

export default startServer;
