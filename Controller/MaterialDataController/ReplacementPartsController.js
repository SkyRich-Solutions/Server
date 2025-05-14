import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';


export const getMaterialReplacementParts = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM ReplacementPart'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Replacement Part data',
            error: error.message
        });
    }
};

export const getReplacementPrediction = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM ReplacementPrediction'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Replacement Part Predictions data',
            error: error.message
        });
    }
};

export const getReplacementPredictionGlobal = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM ReplacementPredictionGlobal'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Replacement Part Global Predictions data',
            error: error.message
        });
    }
};

export const getMaterialReplacementPartsTrends = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM ReplacementTrends'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Replacement Part Trends data',
            error: error.message
        });
    }
};