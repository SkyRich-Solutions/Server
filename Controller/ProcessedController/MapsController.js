import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const MaintPlant = async (req, res) => {
    try {
        // const data = await Predictions_DataDbInstance.all(
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM TurbineData WHERE MaintPlant IS NOT NULL'
        );
        res.status(200).json({ success: true, data: data });
        // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch MainPlant data',
            error: error.message
        });
    }
};

export const PlanningPlant = async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM TurbineData WHERE PlanningPlant IS NOT NULL'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch PlanningPlant data',
            error: error.message
        });
    }
};

export const MainAndPlanningPlant = async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM TurbineData WHERE MaintPlant IS NOT NULL AND PlanningPlant IS NOT NULL'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch MainPlant and PlanningPlant data',
            error: error.message
        });
    }
};
