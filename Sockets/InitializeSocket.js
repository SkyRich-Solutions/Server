import { Server } from 'socket.io';

export const InitializeSocket = (server) => {
    console.log('🔌 Initializing WebSocket ...');
    const io = new Server(server, {
        cors: {
            origin: '*', // Allow all origins, adjust as needed
            methods: ['GET', 'POST']
        }
    });

    // Handle WebSocket connection
    io.on('connection', (socket) => {
        console.log('a user connected');

        // Listen for custom events
        socket.on('message', (msg) => {
            console.log('Received message:', msg);
            socket.emit('message', 'Message received: ' + msg); // Example response
        });

        socket.on('disconnect', () => {
            console.log('a user disconnected');
        });
    });

    return io;
};
