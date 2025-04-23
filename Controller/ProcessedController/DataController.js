import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';


export const getUnprocessedTurbineData = async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM TurbineData'
        );
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching unprocessed TurbineData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unprocessed TurbineData',
            error: error.message
        });
    }
};

export const getUnprocessedMaterialData = async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM MaterialData'
        );
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching unprocessed MaterialData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unprocessed MaterialData',
            error: error.message
        });
    }
};

export const getProcessedMaterialData = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT * FROM MaterialData'
        );
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching processed MaterialData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch processed MaterialData',
            error: error.message
        });
    }
};

export const getProcessedTurbineData = async (req, res) => {
    try {
        const data = await processedDbInstance.all('SELECT * FROM TurbineData');
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching processed TurbineData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch processed TurbineData',
            error: error.message
        });
    }
};

export const getPredictionsData = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM TurbineData'
        );
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching prediction data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prediction data',
            error: error.message
        });
    }
};

export const getTechnicians = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT Technician_ID, Name FROM Technician'
        );
        res.status(200).json({ success: true, data: data || [] }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch technician data',
            error: error.message
        });
    }
};
