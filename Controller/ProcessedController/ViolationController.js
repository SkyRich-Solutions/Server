import { processedDbInstance } from '../../Database/Database.js';

//-------------------- Material --------------------//

export const getMaterialReplacementPartsViolations = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM MaterialData WHERE ViolationReplacementPart = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Violations',
            error: error.message
        });
    }
};

export const getMaterialCompliantReplacementParts = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM MaterialData WHERE ViolationReplacementPart = 0'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Violations0',
            error: error.message
        });
    }
};

export const getMaterialClassified = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE MaterialCategory != 'Unclassified'`
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
};

export const getMaterialUnclassified = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE MaterialCategory = 'Unclassified'`
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
};

export const getMaterialUnknownPlant = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE UnknownPlant = 'Unknown'`
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
};

export const getMaterialKnownPlant = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE UnknownPlant = 'Known'`
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
};

//-------------------- Turbine --------------------//

export const getTurbineUnknownPlanningPlantViolation = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownPlanningPlant = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations',
            error: error.message
        });
    }
};

export const getTurbineUnknownMaintPlantViolation = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownMaintPlant = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations',
            error: error.message
        });
    }
};

export const getTurbineKnownMaintPlant = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownMaintPlant = 0'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
};

export const getTurbineKnownPlanningPlant = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownPlanningPlant = 0'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Planning Plant',
            error: error.message
        });
    }
};

export const getTurbineUnknownLocation = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownLocation = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Unknown Turbine Loaction',
            error: error.message
        });
    }
};
export const getTurbineKnownLocation = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownLocation = 0'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Known Turbine Loaction',
            error: error.message
        });
    }
};
