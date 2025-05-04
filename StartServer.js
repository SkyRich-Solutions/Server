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
    message: 'API is running smoothly',
  });
});

// Define the server function first
const startServer = async () => {
  const server = http.createServer(app);

  try {
    await startDatabases();
    server.listen(PORT, () => {
      console.log(`Server is running on Port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting databases:', error.message);
  }
};

startServer(); // Now this is after definition

export default startServer;
