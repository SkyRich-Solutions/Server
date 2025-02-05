import fs from 'fs';
import Papa from 'papaparse';
import mongoose from 'mongoose';

const extractDataFromFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);

            Papa.parse(data, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const normalizedData = result.data.map((row) => {
                        const normalizedRow = {};
                        Object.keys(row).forEach((key) => {
                            const normalizedKey = key
                                .trim()
                                .replace(/\s+/g, '_') // Replace spaces with underscores
                                .replace(/\-/g, '_') // Replace hyphens with underscores
                                .replace(/\._/g, '_') // Replace ._ with _
                                .replace(/\(.*\)/, ''); // Remove text in parentheses

                            normalizedRow[normalizedKey] = row[key] || ''; // Ensure empty values are set as empty strings
                        });
                        return normalizedRow;
                    });

                    resolve(normalizedData);
                },
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

export { extractDataFromFile, generateSchemaAndInsertData };