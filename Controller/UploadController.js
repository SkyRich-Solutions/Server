import { dbInstance } from '../Database/Database.js';

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
