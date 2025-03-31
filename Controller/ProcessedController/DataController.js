import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

/**
 * POST Method: Receives cleaned data from Python and persists it into the processed database.
 */
export const uploadProcessedTurbineData = async (req, res) => {
    try {
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid TurbineData format' });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            await processedDbInstance.run(
                `INSERT OR REPLACE INTO TurbineData 
                (FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, 
                Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, 
                SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, 
                TurbineLatitude, TurbineLongitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.FunctionalLoc,
                    record.Description,
                    record.MaintPlant,
                    record.PlanningPlant,
                    record.Platform,
                    record.WTShortName,
                    record.TurbineModel,
                    record.MkVersion,
                    record.Revision,
                    record.NominalPower,
                    record.OriginalEqManufact,
                    record.SBOMForTurbine,
                    record.SCADAName,
                    record.SCADAParkID,
                    record.SCADACode,
                    record.SCADAFunctionalLoc,
                    record.TechID,
                    record.Region,
                    record.Technology,
                    record.HubHeight,
                    record.TowerHeight,
                    record.TurbineClass,
                    record.TurbineLatitude,
                    record.TurbineLongitude
                ]
            );
        }

        await processedDbInstance.run('COMMIT');
        res.status(201).json({ success: true, message: 'Cleaned TurbineData successfully persisted' });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        console.error('Error saving cleaned TurbineData:', error);
        res.status(500).json({ success: false, message: 'Failed to save cleaned TurbineData', error: error.message });
    }
};
export const uploadProcessedMaterialData = async (req, res) => {
    try {
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid MaterialData format' });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            await processedDbInstance.run(
                `INSERT OR REPLACE INTO MaterialData 
                (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                Serial_No_Profile, ReplacementPart, UsedInSBom, Violation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.Material, record.Plant, record.Description, record.PlantSpecificMaterialStatus, 
                    record.BatchManagementPlant, record.SerialNoProfile, record.ReplacementPart, 
                    record.UsedInSBom, record.Violation
                ]
            );
        }

        await processedDbInstance.run('COMMIT');

        res.status(201).json({ success: true, message: 'Cleaned MaterialData successfully persisted' });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        console.error('Error saving cleaned data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save cleaned data',
            error: error.message
        });

    }
};

export const uploadPredictionsData = async (req, res) => {
    try {
        const processed_Data = req.body;

        if (!Array.isArray(processed_Data) || processed_Data.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid data format' });
        }

        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const record of processed_Data) {
            await Predictions_DataDbInstance.run(
                `INSERT OR REPLACE INTO TurbineData 
                (FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, 
                Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, 
                SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, 
                TurbineLatitude, TurbineLongitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.FunctionalLoc,
                    record.Description,
                    record.MaintPlant || null, // Ensure null if missing for FK constraint
                    record.PlanningPlant || null,
                    record.Platform || null,
                    record.WTShortName || null,
                    record.TurbineModel || null,
                    record.MkVersion || null,
                    record.Revision || null,
                    record.NominalPower || null, // Ensure correct numeric format
                    record.OriginalEqManufact || null,
                    record.SBOMForTurbine || null,
                    record.SCADAName || null,
                    record.SCADAParkID || null,
                    record.SCADACode || null,
                    record.SCADAFunctionalLoc || null,
                    record.TechID || null,
                    record.Region || null,
                    record.Technology || null,
                    record.HubHeight || null,
                    record.TowerHeight || null,
                    record.TurbineClass || null,
                    record.TurbineLatitude
                        ? parseFloat(record.TurbineLatitude)
                        : null, // Ensure float conversion
                    record.TurbineLongitude
                        ? parseFloat(record.TurbineLongitude)
                        : null // Ensure float conversion
                ]
            );
        }

        await Predictions_DataDbInstance.run('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Processed data successfully persisted'
        });
    } catch (error) {
        await Predictions_DataDbInstance.run('ROLLBACK');
        console.error('Error saving Processed data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save Processed data',
            error: error.message
        });
    }
};

export const getUnprocessedTurbineData
= async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all('SELECT * FROM TurbineData');
        console.log('Unprocessed TurbineData:', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching unprocessed TurbineData:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unprocessed TurbineData', error: error.message });
    }
}

export const getUnprocessedMaterialData
= async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all('SELECT * FROM MaterialData');
        console.log('Unprocessed MaterialData:', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching unprocessed MaterialData:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch unprocessed MaterialData', error: error.message });
    }
};

export const getProcessedData = async (req, res) => {
    try {
        const data = await processedDbInstance.all('SELECT * FROM TurbineData');
        // console.log('Processed data(Turbine Data):', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching processed data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch processed data',
            error: error.message
        });
    }
};

export const getPredictionsData = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all('SELECT * FROM TurbineData');
        console.log('Prediction data(Turbine Data):', data);
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
``