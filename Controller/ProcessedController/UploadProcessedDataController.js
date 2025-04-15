import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';


export const uploadProcessedTurbineData = async (req, res) => {
    try {
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Invalid TurbineData format'
                });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            try {
                if (!record.FunctionalLoc || !record.MaintPlant) {
                    console.warn(
                        'Skipping record due to missing FunctionalLoc or MaintPlant:',
                        record
                    );
                    continue;
                }

                const existing = await processedDbInstance.get(
                    `SELECT 1 FROM TurbineData WHERE FunctionalLoc = ?`,
                    [record.FunctionalLoc]
                );

                if (existing) {
                    await processedDbInstance.run(
                        `UPDATE TurbineData 
                         SET Description = ?, MaintPlant = ?, PlanningPlant = ?, Platform = ?, WTShortName = ?, 
                             TurbineModel = ?, MkVersion = ?, Revision = ?, NominalPower = ?, OriginalEqManufact = ?, 
                             SBOMForTurbine = ?, SCADAName = ?, SCADAParkID = ?, SCADACode = ?, SCADAFunctionalLoc = ?, 
                             TechID = ?, Region = ?, Technology = ?, HubHeight = ?, TowerHeight = ?, TurbineClass = ?, UnknownMaintPlant = ?, UnknownPlanningPlant = ?,
                             TurbineLatitude = ?, TurbineLongitude = ?
                         WHERE FunctionalLoc = ?`,
                        [
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
                            record.TurbineLatitude
                                ? Number(
                                      parseFloat(
                                          record.TurbineLatitude
                                      ).toFixed(6)
                                  )
                                : null,
                            record.TurbineLongitude
                                ? Number(
                                      parseFloat(
                                          record.TurbineLongitude
                                      ).toFixed(6)
                                  )
                                : null,
                            record.FunctionalLoc
                        ]
                    );
                } else {
                    await processedDbInstance.run(
                        `INSERT INTO TurbineData 
                         (FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, 
                          Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, 
                          SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, UnknownMaintPlant, UnknownPlanningPlant, 
                          TurbineLatitude, TurbineLongitude)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                            record.UnknownMaintPlant,
                            record.UnknownPlanningPlant,
                            record.TurbineLatitude
                                ? Number(
                                      parseFloat(
                                          record.TurbineLatitude
                                      ).toFixed(6)
                                  )
                                : null,
                            record.TurbineLongitude
                                ? Number(
                                      parseFloat(
                                          record.TurbineLongitude
                                      ).toFixed(6)
                                  )
                                : null
                        ]
                    );
                }
            } catch (rowError) {
                console.error(
                    `Failed to persist record for FunctionalLoc ${record.FunctionalLoc}:`,
                    rowError
                );
            }
        }

        await processedDbInstance.run('COMMIT');
        res.status(201).json({
            success: true,
            message: 'Cleaned TurbineData successfully persisted'
        });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        console.error('Error saving cleaned TurbineData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save cleaned TurbineData',
            error: error.message
        });
    }
};

export const uploadProcessedMaterialData = async (req, res) => {
    try {
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Invalid MaterialData format'
                });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');
        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            const values = [
                record.Description,
                record.PlantSpecificMaterialStatus,
                record.BatchManagementPlant,
                record.Serial_No_Profile,
                record.ReplacementPart,
                record.UsedInSBom,
                record.ViolationReplacementPart,
                record.MaterialCategory,
                record.UnknownPlant,
                record.Material,
                record.Plant
            ];

            const insertValues = [
                record.Material,
                record.Plant,
                ...values.slice(0, 9)
            ];

            const updateQuery = `
                UPDATE MaterialData 
                SET Description = ?, PlantSpecificMaterialStatus = ?, BatchManagementPlant = ?, 
                    Serial_No_Profile = ?, ReplacementPart = ?, UsedInSBom = ?, ViolationReplacementPart = ?, 
                    MaterialCategory = ?, UnknownPlant = ?
                WHERE Material = ? AND Plant = ?
            `;

            const insertQuery = `
                INSERT INTO MaterialData 
                (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                 Serial_No_Profile, ReplacementPart, UsedInSBom, ViolationReplacementPart, MaterialCategory, UnknownPlant)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const db of [processedDbInstance, Predictions_DataDbInstance]) {
                const existing = await db.get(
                    `SELECT 1 FROM MaterialData WHERE Material = ? AND Plant = ?`,
                    [record.Material, record.Plant]
                );

                if (existing) {
                    await db.run(updateQuery, values);
                } else {
                    await db.run(insertQuery, insertValues);
                }
            }
        }

        await processedDbInstance.run('COMMIT');
        await Predictions_DataDbInstance.run('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Cleaned MaterialData successfully persisted to both databases'
        });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        await Predictions_DataDbInstance.run('ROLLBACK');
        console.error('Error saving cleaned data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save cleaned data',
            error: error.message
        });
    }
};
