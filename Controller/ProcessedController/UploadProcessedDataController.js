import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';


export const uploadProcessedTurbineData = async (req, res) => {
    try {
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid TurbineData format'
            });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');

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
                             TechID = ?, Region = ?, Technology = ?, HubHeight = ?, TowerHeight = ?, TurbineClass = ?, 
                             UnknownMaintPlant = ?, UnknownPlanningPlant = ?, UnknownLocation = ?, TurbineLatitude = ?, 
                             TurbineLongitude = ? WHERE FunctionalLoc = ?`,
                        [...insertValues.slice(1), record.FunctionalLoc] // use everything except FunctionalLoc, then add it last for WHERE clause
                    );
                } else {
                    await processedDbInstance.run(
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

        await processedDbInstance.run('COMMIT');
        res.status(201).json({
            success: true,
            message: 'Cleaned TurbineData successfully persisted'
        });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        console.error(' Error saving cleaned TurbineData:', error);
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
            return res.status(400).json({
                success: false,
                message: 'Invalid MaterialData format'
            });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');
        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            const baseValues = [
                record.Description,
                record.PlantSpecificMaterialStatus,
                record.BatchManagementPlant,
                record.Serial_No_Profile,
                record.ReplacementPart,
                record.UsedInSBom,
                record.ViolationReplacementPart,
                record.MaterialCategory,
                record.UnknownPlant
            ];

            const insertValues = [
                record.Material,
                record.Plant,
                ...baseValues
            ];

            const updateQueryBase = `
                UPDATE MaterialData 
                SET Description = ?, PlantSpecificMaterialStatus = ?, BatchManagementPlant = ?, 
                    Serial_No_Profile = ?, ReplacementPart = ?, UsedInSBom = ?, ViolationReplacementPart = ?, 
                    MaterialCategory = ?, UnknownPlant = ?
                WHERE Material = ? AND Plant = ?
            `;

            const insertQueryBase = `
                INSERT INTO MaterialData 
                (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                 Serial_No_Profile, ReplacementPart, UsedInSBom, ViolationReplacementPart, MaterialCategory, UnknownPlant)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const db of [processedDbInstance, Predictions_DataDbInstance]) {
                const isPredictionsDb = db === Predictions_DataDbInstance;
                const hasTimestamp = typeof record.Timestamp === 'string';

                let insertQuery = insertQueryBase;
                let updateQuery = updateQueryBase;
                let insertVals = insertValues.slice();
                let updateVals = baseValues.slice();

                if (isPredictionsDb && hasTimestamp) {
                    insertQuery = `
                        INSERT INTO MaterialData 
                        (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                         Serial_No_Profile, ReplacementPart, UsedInSBom, ViolationReplacementPart, MaterialCategory, 
                         UnknownPlant, Timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    updateQuery = `
                        UPDATE MaterialData 
                        SET Description = ?, PlantSpecificMaterialStatus = ?, BatchManagementPlant = ?, 
                            Serial_No_Profile = ?, ReplacementPart = ?, UsedInSBom = ?, ViolationReplacementPart = ?, 
                            MaterialCategory = ?, UnknownPlant = ?, Timestamp = ?
                        WHERE Material = ? AND Plant = ?
                    `;
                    insertVals.push(record.Timestamp);
                    updateVals.push(record.Timestamp);
                }

                updateVals.push(record.Material, record.Plant); // WHERE clause

                const exists = await db.get(
                    `SELECT 1 FROM MaterialData WHERE Material = ? AND Plant = ?`,
                    [record.Material, record.Plant]
                );

                if (exists) {
                    await db.run(updateQuery, updateVals);
                } else {
                    await db.run(insertQuery, insertVals);
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
        console.error('❌ Error saving cleaned data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save cleaned data',
            error: error.message
        });
    }
};

export const fetchReplacementParts = async (req, res) => {
    try {
        const rows = await Predictions_DataDbInstance.all(`
            SELECT
                Material_ID,
                Plant_ID,
                datetime(timestamp) AS Timestamp,
                datetime(ReplacementDate) AS ReplacementDate
            FROM ReplacementPart
        `);

        res.status(200).json({ data: rows });
    } catch (err) {
        console.error("Error fetching ReplacementParts:", err);
        res.status(500).json({ error: "Failed to fetch replacement part data" });
    }
};


export const fetchPlantTable = async (req, res) => {
    try {
        const rows = await Predictions_DataDbInstance.all(`SELECT Plant_ID, Plant_Name FROM Plant`);
        res.status(200).json({ plants: rows });
    } catch (err) {
        console.error("Error fetching Plant table:", err);
        res.status(500).json({ error: "Failed to fetch plant table" });
    }
};

export const fetchMaterialTable = async (req, res) => {
    try {
        const rows = await Predictions_DataDbInstance.all(`
            SELECT Material_ID, Material_A9B_Number
            FROM Material
        `);

        res.status(200).json({ materials: rows });
    } catch (err) {
        console.error("Error fetching Material table:", err);
        res.status(500).json({ error: "Failed to fetch Material table" });
    }
};

