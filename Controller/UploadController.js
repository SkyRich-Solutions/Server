import { dbInstance, InitializeDatabase } from '../Database/Database.js';
import multer from 'multer';
import fs from 'fs';
import Papa from 'papaparse';

// Multer storage setup (temporary folder for uploads)
const upload = multer({ dest: 'uploads/' });

// Mapping CSV headers to database column names
const csvToDbColumnMapping = {
    "Material": "Material",
    "Description": "Description",
    "Plant": "Plant",
    "Plant-Specific Material Status": "PlantSpecificMaterialStatus",
    "Batch Management(Plant)": "BatchManagementPlant",
    "Serial No. Profile": "SerialNoProfile",
    "Replacement Part": "ReplacementPart",
    "Used in a S-bom": "UsedInSBom"
};

// Upload CSV File API with header validation
export const uploadCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path;

        // Read and parse CSV file
        const data = await readCSVFile(filePath);

        // Validate headers before proceeding
        const headerValidationResult = validateHeaders(data);
        if (!headerValidationResult.valid) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'Invalid CSV headers',
                missingHeaders: headerValidationResult.missingHeaders,
                unexpectedHeaders: headerValidationResult.unexpectedHeaders,
                suggestion: 'Please ensure your CSV file follows the correct format and contains the required columns.'
            });
        }

        // Insert extracted data into SQLite
        await insertDataIntoDB(data);

        // Remove the temporary file
        fs.unlinkSync(filePath);

        res.status(200).json({ success: true, message: 'File uploaded and data inserted successfully!' });

    } catch (error) {
        console.error('Error processing CSV:', error);
        res.status(500).json({ success: false, message: 'Failed to process CSV', error: error.message });
    }
};

// Function to read and parse CSV
const readCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);

            Papa.parse(data, {
                header: true, // First row contains column names
                skipEmptyLines: true,
                complete: (result) => resolve(result.data),
                error: (error) => reject(error),
            });
        });
    });
};

// Function to validate CSV headers and return missing/unexpected headers
const validateHeaders = (data) => {
    if (!data || data.length === 0) {
        return { valid: false, missingHeaders: [], unexpectedHeaders: [] };
    }

    const csvHeaders = Object.keys(data[0]);
    const expectedHeaders = Object.keys(csvToDbColumnMapping);

    // Find missing headers
    const missingHeaders = expectedHeaders.filter(header => !csvHeaders.includes(header));

    // Find unexpected headers
    const unexpectedHeaders = csvHeaders.filter(header => !expectedHeaders.includes(header));

    return {
        valid: missingHeaders.length === 0 && unexpectedHeaders.length === 0,
        missingHeaders,
        unexpectedHeaders
    };
};

// Function to insert extracted data into SQLite
const insertDataIntoDB = async (data) => {
    const db = await InitializeDatabase();
    try {
        // Prepare the insert query
        const query = `
            INSERT INTO MaterialData (Material, Description, Plant, PlantSpecificMaterialStatus, BatchManagementPlant, SerialNoProfile, ReplacementPart, UsedInSBom) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Iterate over the data and insert each row
        for (const row of data) {
            await db.run(query, [
                row["Material"], 
                row["Description"], 
                row["Plant"], 
                row["Plant-Specific Material Status"],
                row["Batch Management(Plant)"], 
                row["Serial No. Profile"], 
                row["Replacement Part"], 
                row["Used in a S-bom"]
            ]);
        }

        console.log('✅ Data inserted successfully!');
    } catch (error) {
        console.error('Error inserting data into DB:', error.message);
    }
};

// Export Multer upload middleware
export { upload };

// API to fetch data from the database
export const getJson = async (req, res) => {
    try {
        if (!dbInstance) {
            throw new Error('Database connection is not established');
        }

        const query = `SELECT * FROM MaterialData;`;
        const rows = await dbInstance.all(query);

        res.status(200).json({
            success: true,
            message: 'Data retrieved successfully',
            data: rows
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve data',
            error: error.message
        });
    }
};
