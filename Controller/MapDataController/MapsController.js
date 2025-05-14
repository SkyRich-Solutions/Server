import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const getAllTurbine = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
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

export const WarehousePlanningPlant = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM Plant WHERE IsPlanningPlant = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch  WarehousePlanningPlant',
            error: error.message
        });
    }
}

export const WarehouseManufacturingPlant = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM Plant WHERE IsManufacturingPlant = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch WarehouseManufacturingPlant',
            error: error.message
        });
    }
}

export const WarehousePlant = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM Plant WHERE IsPlant = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetchWarehousePlant',
            error: error.message
        });
    }
}