import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import corsMiddleware from './Config/cors.js';
import testRoute from './Routes/testRoute.js';

dotenv.config();

const upload = multer({ dest: 'uploads/' }); // Save files in 'uploads/' temporarily

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

const extractDataFromFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);

            Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => resolve(result.data),
                error: (error) => reject(error)
            });
        });
    });
};

const generateSchemaAndInsertData = async (collectionName, data) => {
    const headers = Object.keys(data[0]);
    const schemaDefinition = {};

    headers.forEach((header) => {
        schemaDefinition[header] = { type: String, default: '' };
    });

    const dynamicSchema = new mongoose.Schema(schemaDefinition, {
        timestamps: true
    });
    const DynamicModel = mongoose.model(collectionName, dynamicSchema);

    await DynamicModel.insertMany(data);
    console.log(
        `Data successfully inserted into collection: ${collectionName}`
    );
};

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const collectionName = `DynamicTable_${Date.now()}`;
        const data = await extractDataFromFile(file.path);

        if (data.length === 0) {
            return res
                .status(400)
                .json({ message: 'CSV file is empty or invalid.' });
        }

        await generateSchemaAndInsertData(collectionName, data);

        fs.unlinkSync(file.path); // Delete the file after processing
        res.status(200).json({
            message: 'File processed and data stored successfully',
            collectionName
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            message: 'An error occurred',
            error: err.message
        });
    }
});

// Use CORS Middleware
app.use(corsMiddleware);

// JSON Parsing Middleware
app.use(express.json());

// Authentication Middleware
app.use(cookieParser());

const PORT = process.env.PORT || 4000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} :)`);
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Server is Running ...'
    });
});

app.use('/test', testRoute);

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

export default app; // Export the app
