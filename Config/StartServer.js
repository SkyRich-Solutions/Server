import app from './index.js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 4000;

// Start the server
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} :)`);
    });
};

export default startServer;
