import { processedDbInstance } from "../../Database/Database.js";

export const getViolations = async (req, res) => {
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


export const getViolations0= async (req, res) => {
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


export const getTurbineViolation= async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownMaintPlant = 1 OR UnknownPlanningPlant = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations',
            error: error.message
        });
    }
}

export const getTurbineViolation0 = async (req, res) => {
    try { 
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM TurbineData WHERE UnknownMaintPlant = 0 AND UnknownPlanningPlant = 0'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
}

export const getMaterialClassified = async (req, res) => {
    try { 
        const data = await processedDbInstance.all(
            `SELECT COUNT(*) AS total_violations FROM MaterialData WHERE MaterialCategory = 'Electrical'`
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Turbine Violations0',
            error: error.message
        });
    }
}

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
}

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
}

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
}

