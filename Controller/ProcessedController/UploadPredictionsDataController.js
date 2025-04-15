import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const uploadMaterialPredictionsData = async (req, res) => {
    try {
        const processed_Data = req.body;

        if (!Array.isArray(processed_Data) || processed_Data.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid data format' });
        }

        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const record of processed_Data) {
            // Check if record exists
            const existing = await Predictions_DataDbInstance.get(
                `SELECT 1 FROM MaterialData WHERE Material = ? AND Plant = ?`,
                [record.Material, record.Plant]
            );

            if (existing) {
                // If exists, update only necessary fields
                await Predictions_DataDbInstance.run(
                    `UPDATE MaterialData 
                     SET Description = ?, PlantSpecificMaterialStatus = ?, BatchManagementPlant = ?, 
                         Serial_No_Profile = ?, ReplacementPart = ?, UsedInSBom = ?,  ViolationReplacementPart = ?, MaterialCategory = ?, UnknownPlant = ?
                     WHERE Material = ? AND Plant = ?`,
                    [
                        record.Description || null,
                        record.PlantSpecificMaterialStatus || null,
                        record.BatchManagementPlant || null,
                        record.Serial_No_Profile || null,
                        record.ReplacementPart || null,
                        record.UsedInSBom || null,
                        record.ViolationReplacementPart || null,
                        record.MaterialCategory || null,
                        record.UnknownPlant || null,
                        record.Material,
                        record.Plant
                    ]
                );
            } else {
                // If not exists, insert new record
                await Predictions_DataDbInstance.run(
                    `INSERT INTO MaterialData 
                    (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                    Serial_No_Profile, ReplacementPart, UsedInSBom, ViolationReplacementPart, MaterialCategory, UnknownPlant)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.Material,
                        record.Plant,
                        record.Description || null,
                        record.PlantSpecificMaterialStatus || null,
                        record.BatchManagementPlant || null,
                        record.Serial_No_Profile || null,
                        record.ReplacementPart || null,
                        record.UsedInSBom || null,
                        record.MaterialCategory || null,
                        record.ViolationReplacementPart || null,
                        record.UnknownPlant || null
                    ]
                );
            }
        }

        await Predictions_DataDbInstance.run('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Processed material data successfully persisted'
        });
    } catch (error) {
        await Predictions_DataDbInstance.run('ROLLBACK');
        console.error('Error saving processed material data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save processed material data',
            error: error.message
        });
    }
};

export const uploadTurbinePredictionsData = async (req, res) => {
    try {
        const processed_Data = req.body;

        if (!Array.isArray(processed_Data) || processed_Data.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid data format' });
        }

        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const record of processed_Data) {
            // Check if record exists
            const existing = await Predictions_DataDbInstance.get(
                `SELECT 1 FROM TurbineData WHERE FunctionalLoc = ?`,
                [record.FunctionalLoc]
            );

            if (existing) {
                // If exists, update only necessary fields
                await Predictions_DataDbInstance.run(
                    `UPDATE TurbineData 
                     SET Description = ?, MaintPlant = ?, PlanningPlant = ?, Platform = ?, WTShortName = ?, 
                         TurbineModel = ?, MkVersion = ?, Revision = ?, NominalPower = ?, OriginalEqManufact = ?, 
                         SBOMForTurbine = ?, SCADAName = ?, SCADAParkID = ?, SCADACode = ?, SCADAFunctionalLoc = ?, 
                         TechID = ?, Region = ?, Technology = ?, HubHeight = ?, TowerHeight = ?, TurbineClass = ?, UnknownMaintPlant = ?, UnknownPlanningPlant = ?,
                         TurbineLatitude = ?, TurbineLongitude = ?
                     WHERE FunctionalLoc = ?`,
                    [
                        record.Description,
                        record.MaintPlant || null,
                        record.PlanningPlant || null,
                        record.Platform || null,
                        record.WTShortName || null,
                        record.TurbineModel || null,
                        record.MkVersion || null,
                        record.Revision || null,
                        record.NominalPower || null,
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
                        record.UnknownMaintPlant || null,
                        record.UnknownPlanningPlant || null,
                        record.TurbineLatitude
                            ? Number(
                                  parseFloat(record.TurbineLatitude).toFixed(6)
                              )
                            : null,
                        record.TurbineLongitude
                            ? Number(
                                  parseFloat(record.TurbineLongitude).toFixed(6)
                              )
                            : null,
                        record.FunctionalLoc
                    ]
                );
            } else {
                // If not exists, insert new record
                await Predictions_DataDbInstance.run(
                    `INSERT INTO TurbineData 
                    (FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, 
                    Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, 
                    SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, UnknownMaintPlant, UnknownPlanningPlant,
                    TurbineLatitude, TurbineLongitude)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.FunctionalLoc,
                        record.Description,
                        record.MaintPlant || null,
                        record.PlanningPlant || null,
                        record.Platform || null,
                        record.WTShortName || null,
                        record.TurbineModel || null,
                        record.MkVersion || null,
                        record.Revision || null,
                        record.NominalPower || null,
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
                        record.UnknownMaintPlant || null,
                        record.UnknownPlanningPlant || null,
                        record.TurbineLatitude
                            ? Number(
                                  parseFloat(record.TurbineLatitude).toFixed(6)
                              )
                            : null,
                        record.TurbineLongitude
                            ? Number(
                                  parseFloat(record.TurbineLongitude).toFixed(6)
                              )
                            : null
                    ]
                );
            }
        }

        await Predictions_DataDbInstance.run('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Processed turbine data successfully persisted'
        });
    } catch (error) {
        await Predictions_DataDbInstance.run('ROLLBACK');
        console.error('Error saving processed turbine data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save processed turbine data',
            error: error.message
        });
    }
};