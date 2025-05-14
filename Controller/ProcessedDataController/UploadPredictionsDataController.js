import { Predictions_DataDbInstance } from '../../Database/Database.js';
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
            const material = record.Material;
            const plant = record.Plant;

            // Normalize fallback values
            const autoClassified = record.Auto_Classified ?? 0;
            const newlyDiscovered = record.NewlyDiscovered ?? 0;
            const manuallyClassified = record.Manually_Classified ?? 0;

            const existing = await Predictions_DataDbInstance.get(
                `SELECT Manually_Classified FROM MaterialData WHERE Material = ? AND Plant = ?`,
                [record.Material, record.Plant]
            );
            
            const isManual = existing?.Manually_Classified === 1;
            
            if (existing && isManual) {
                // Skip update to preserve manual classification
                continue;
            }            

            if (existing) {
                await Predictions_DataDbInstance.run(
                    `UPDATE MaterialData 
                     SET Description = ?, PlantSpecificMaterialStatus = ?, BatchManagementPlant = ?, 
                         Serial_No_Profile = ?, ReplacementPart = ?, UsedInSBom = ?, ViolationReplacementPart = ?, 
                         MaterialCategory = ?, UnknownPlant = ?, Auto_Classified = ?, NewlyDiscovered = ?, Manually_Classified = ?
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
                        autoClassified,
                        newlyDiscovered,
                        manuallyClassified,
                        material,
                        plant
                    ]
                );
            } else {
                await Predictions_DataDbInstance.run(
                    `INSERT INTO MaterialData 
                    (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                     Serial_No_Profile, ReplacementPart, UsedInSBom, ViolationReplacementPart, MaterialCategory, 
                     UnknownPlant, Auto_Classified, NewlyDiscovered, Manually_Classified)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        material,
                        plant,
                        record.Description || null,
                        record.PlantSpecificMaterialStatus || null,
                        record.BatchManagementPlant || null,
                        record.Serial_No_Profile || null,
                        record.ReplacementPart || null,
                        record.UsedInSBom || null,
                        record.ViolationReplacementPart || null,
                        record.MaterialCategory || null,
                        record.UnknownPlant || null,
                        autoClassified,
                        newlyDiscovered,
                        manuallyClassified
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
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid TurbineData format'
            });
        }

        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            try {
                if (!record.FunctionalLoc || !record.MaintPlant) {
                    console.warn('Skipping record due to missing FunctionalLoc or MaintPlant:', record);
                    continue;
                }

                // Validate UnknownLocation
                if (typeof record.UnknownLocation === 'undefined') {
                    console.warn(`Missing UnknownLocation for FunctionalLoc ${record.FunctionalLoc}`);
                }

                // Safety: convert to string if needed
                const unknownLocation = (record.UnknownLocation ?? "0").toString();

                const insertValues = [
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
                    record.UnknownMaintPlant,
                    record.UnknownPlanningPlant,
                    unknownLocation,
                    record.TurbineLatitude
                        ? Number(parseFloat(record.TurbineLatitude).toFixed(6))
                        : null,
                    record.TurbineLongitude
                        ? Number(parseFloat(record.TurbineLongitude).toFixed(6))
                        : null
                ];

                // DEBUG: Log the insert size
                if (insertValues.length !== 27) {
                    console.error(` Mismatch: Expected 27 values, got ${insertValues.length}`);
                    console.error('Record:', record);
                    throw new Error('Insert value count mismatch');
                }

                const existing = await Predictions_DataDbInstance.get(
                    `SELECT 1 FROM TurbineData WHERE FunctionalLoc = ?`,
                    [record.FunctionalLoc]
                );

                if (existing) {
                    await Predictions_DataDbInstance.run(
                        `UPDATE TurbineData 
                         SET Description = ?, MaintPlant = ?, PlanningPlant = ?, Platform = ?, WTShortName = ?, 
                             TurbineModel = ?, MkVersion = ?, Revision = ?, NominalPower = ?, OriginalEqManufact = ?, 
                             SBOMForTurbine = ?, SCADAName = ?, SCADAParkID = ?, SCADACode = ?, SCADAFunctionalLoc = ?, 
                             TechID = ?, Region = ?, Technology = ?, HubHeight = ?, TowerHeight = ?, TurbineClass = ?, 
                             UnknownMaintPlant = ?, UnknownPlanningPlant = ?, UnknownLocation = ?, TurbineLatitude = ?, 
                             TurbineLongitude = ? WHERE FunctionalLoc = ?`,
                        [...insertValues.slice(1), record.FunctionalLoc] // use everything except FunctionalLoc, then add it last for WHERE clause
                    );
                } else {
                    await Predictions_DataDbInstance.run(
                        `INSERT INTO TurbineData 
                         (FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, 
                          Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, 
                          SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, 
                          UnknownMaintPlant, UnknownPlanningPlant, UnknownLocation, TurbineLatitude, TurbineLongitude)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        insertValues
                    );
                }
            } catch (rowError) {
                console.error(` Failed to persist record for FunctionalLoc ${record.FunctionalLoc}:`, rowError);
            }
        }

        await Predictions_DataDbInstance.run('COMMIT');
        res.status(201).json({
            success: true,
            message: 'Cleaned TurbineData successfully persisted'
        });
    } catch (error) {
        await Predictions_DataDbInstance.run('ROLLBACK');
        console.error(' Error saving cleaned TurbineData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save cleaned TurbineData',
            error: error.message
        });
    }
};

export const fetchReplacementPrediction = async (req, res) => {
    try {
        const rows = await Predictions_DataDbInstance.all(`SELECT * FROM ReplacementPrediction`);
        res.status(200).json({ data: rows });
    } catch (err) {
        console.error("Error fetching ReplacementPrediction:", err);
        res.status(500).json({ error: err.message });
    }
};
