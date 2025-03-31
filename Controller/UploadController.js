import { unprocessedDbInstance, InitializeDatabases } from '../Database/Database.js';
import multer from 'multer';
import fs from 'fs';
import Papa from 'papaparse';

// Multer storage setup
const upload = multer({ dest: 'uploads/' });

// Define expected headers for different tables
const tableSchemaMapping = {
    "MaterialData": {
        headers: [
            "Material", "Description", "Plant", "Plant-Specific Material Status",
            "Batch Management(Plant)", "Serial No. Profile", "Replacement Part", "Used in a S-bom"
        ],
        columnMapping: {
            "Material": "Material",
            "Description": "Description",
            "Plant": "Plant",
            "Plant-Specific Material Status": "PlantSpecificMaterialStatus",
            "Batch Management(Plant)": "BatchManagementPlant",
            "Serial No. Profile": "SerialNoProfile",
            "Replacement Part": "ReplacementPart",
            "Used in a S-bom": "UsedInSBom"
        }
    },
    "TurbineData": {
        headers: [
            "Functional Loc.", "Description", "MaintPlant", "Planning Plant", "Platform",
            "WTG Short name", "Turbine Model", "Mk version", "Revision", "Nominal power",
            "Original Eq Manufact", "SBOM for Turbine", "SCADA Name", "SCADA Park ID", "SCADA Code",
            "SCADA FLOC", "Tech ID", "Region", "Technology", "Hub Height", "Tower Height",
            "Turbine Class", "Turbine Latitude", "Turbine Longitude"
        ],
        columnMapping: {
            "Functional Loc.": "FunctionalLoc",
            "Description": "Description",
            "MaintPlant": "MaintPlant",
            "Planning Plant": "PlanningPlant",
            "Platform": "Platform",
            "WTG Short name": "WTShortName",
            "Turbine Model": "TurbineModel",
            "Mk version": "MkVersion",
            "Revision": "Revision",
            "Nominal power": "NominalPower",
            "Original Eq Manufact": "OriginalEqManufact",
            "SBOM for Turbine": "SBOMForTurbine",
            "SCADA Name": "SCADAName",
            "SCADA Park ID": "SCADAParkID",
            "SCADA Code": "SCADACode",
            "SCADA FLOC": "SCADAFunctionalLoc",
            "Tech ID": "TechID",
            "Region": "Region",
            "Technology": "Technology",
            "Hub Height": "HubHeight",
            "Tower Height": "TowerHeight",
            "Turbine Class": "TurbineClass",
            "Turbine Latitude": "TurbineLatitude",
            "Turbine Longitude": "TurbineLongitude"
        }
    }
};

// Upload CSV File API
export const uploadCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path;

        // Read and parse CSV file
        const data = await readCSVFile(filePath);

        // Determine the target table
        const tableSelection = determineTargetTable(data);
        if (!tableSelection.table) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'CSV headers do not match any known table format. Please select the correct data file.',
                expectedHeaders: Object.entries(tableSchemaMapping).map(([table, schema]) => ({
                    table,
                    expectedHeaders: schema.headers
                }))
            });
        }

        const { table, columnMapping } = tableSelection;

        // Insert data into the unprocessed database
        await insertDataIntoUnprocessedDB(data, table, columnMapping);

        // Remove temporary file
        fs.unlinkSync(filePath);

        res.status(200).json({ success: true, message: `File uploaded and data inserted into ${table} successfully!` });

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
                header: true,
                skipEmptyLines: true,
                complete: (result) => resolve(result.data),
                error: (error) => reject(error),
            });
        });
    });
};

// Function to determine the exact match table based on headers
const determineTargetTable = (data) => {
    if (!data || data.length === 0) return { table: null, columnMapping: null };

    const csvHeaders = Object.keys(data[0]);

    for (const [tableName, schema] of Object.entries(tableSchemaMapping)) {
        const expectedHeaders = schema.headers;

        // Check for exact match
        const isExactMatch =
            csvHeaders.length === expectedHeaders.length &&
            csvHeaders.every(header => expectedHeaders.includes(header));

        if (isExactMatch) {
            return { table: tableName, columnMapping: schema.columnMapping };
        }
    }

    return { table: null, columnMapping: null };
};

function parseCoordinate(coord) {
    if (!coord) return null;
    if (typeof coord === 'number') return coord;

    try {
        const parts = String(coord).split(',');
        if (parts.length === 4) {
            const deg = parseFloat(parts[0]);
            const min = parseFloat(parts[1]);
            const sec = parseFloat(parts[2]);
            const milli = parseFloat(parts[3]);
            const decimal = Math.abs(deg) + min / 60 + (sec + milli / 1000) / 3600;
            return deg < 0 ? -decimal : decimal;
        }

        return parseFloat(coord.replace(',', '.'));
    } catch {
        return null;
    }
}

const insertDataIntoUnprocessedDB = async (data, table, columnMapping) => {
    try {
        if (!unprocessedDbInstance) {
            throw new Error('Unprocessed database connection is not established');
        }

        const dbColumns = Object.values(columnMapping);
        const placeholders = dbColumns.map(() => '?').join(', ');
        const query = `INSERT INTO ${table} (${dbColumns.join(', ')}) VALUES (${placeholders})`;

        for (const row of data) {
            const values = Object.keys(columnMapping).map(csvHeader => {
                let value = row[csvHeader] || null;

                // ✅ Fix coordinate parsing here
                if (
                    columnMapping[csvHeader] === "TurbineLatitude" ||
                    columnMapping[csvHeader] === "TurbineLongitude"
                ) {
                    value = parseCoordinate(value);
                }

                return value;
            });

            await unprocessedDbInstance.run(query, values);
        }

        console.log(`✅ Data inserted into ${table} successfully!`);
    } catch (error) {
        console.error(`Error inserting data into ${table}:`, error.message);
    }
};

// Export Multer upload middleware
export { upload };

export const getUnprocessedTurbineData = async (req, res) => {
    try {
        const unprocessedData = await unprocessedDbInstance.all(`SELECT * FROM TurbineData`);

        if (!unprocessedData || unprocessedData.length === 0) {
            return res.status(404).json({ success: false, message: 'No unprocessed TurbineData found' });
        }

        res.status(200).json({ success: true, data: unprocessedData });
    } catch (error) {
        console.error('Error fetching unprocessed data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unprocessed TurbineData', error: error.message });
    }
};

export const getUnprocessedMaterialData = async (req, res) => {
    try {
        const unprocessedData = await unprocessedDbInstance.all(`SELECT * FROM MaterialData`);

        if (!unprocessedData || unprocessedData.length === 0) {
            return res.status(404).json({ success: false, message: 'No unprocessed MaterialData found' });
        }

        res.status(200).json({ success: true, data: unprocessedData });
    } catch (error) {
        console.error('Error fetching unprocessed MaterialData:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unprocessed MaterialData', error: error.message });
    }
};

export const getUnprocessedData = async (req, res) => {
    try {
        const unprocessedData = await unprocessedDbInstance.all(`SELECT * FROM MaterialData`);

        if (!unprocessedData || unprocessedData.length === 0) {
            return res.status(404).json({ success: false, message: 'No unprocessed MaterialData found' });
        }

        res.status(200).json({ success: true, data: unprocessedData });
    } catch (error) {
        console.error('Error fetching unprocessed MaterialData:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unprocessed MaterialData', error: error.message });
    }
};