import fs from 'fs';
import { extractDataFromFile, generateSchemaAndInsertData } from '../Database/FileUploadUtils.js';

export const DynamicFileUpload = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Extract filename without extension
        let collectionName = file.originalname.replace(/\.[^/.]+$/, ''); // Remove file extension
        collectionName = collectionName.replace(/[^a-zA-Z0-9_]/g, '_'); // Ensure MongoDB-safe name

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
};
