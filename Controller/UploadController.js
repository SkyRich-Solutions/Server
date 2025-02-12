import { dbInstance , InitializeDatabase } from '../Database/Database.js';
import multer from 'multer';
import fs from 'fs';
import Papa from 'papaparse';

// Multer storage setup (temporary folder for uploads)
const upload = multer({ dest: 'uploads/' });

// Upload CSV File API
export const uploadCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path;

        // Read and parse CSV file
        const data = await readCSVFile(filePath);
        
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

// Function to insert extracted data into SQLite
const insertDataIntoDB = async (data) => {
    const db = await InitializeDatabase();
    try {
        // Prepare the insert query
        const query = `
            INSERT INTO MaterialData (Material, Description, Plant, PlantSpecificMaterialStatus, BatchManagementPlant, SerialNoProfile, ReplacementPart, UsedInSBom) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Iterate over the data and insert each row
        for (const row of data) {
            await db.run(query, [
                row.Material, 
                row.Description, 
                row.Plant, 
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
export const getJson = async (req, res) => {
    try {
        // Ensure that the database instance is initialized
        if (!dbInstance) {
            throw new Error('Database connection is not established');
        }

        // Query to fetch all data from the MaterialData table
        const query = `SELECT * FROM MaterialData;`;

        // Execute the query using dbInstance.all() (not .query())
        const rows = await dbInstance.all(query);

        // Send the data as a JSON response
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
