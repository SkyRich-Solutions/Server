import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

import fs from 'fs/promises';

let geoMapping;
try {
    geoMapping = JSON.parse(
        await fs.readFile(
            new URL('../../utils/geo_mapping.json', import.meta.url)
        )
    );
} catch (err) {
    console.error('❌ Failed to load geo_mapping.json:', err);
    geoMapping = {};
}

export const syncPlantCoordinates = async (req, res) => {
    const { plants } = req.body;

    if (!Array.isArray(plants)) {
      return res.status(400).json({ success: false, message: 'Invalid plant list' });
    }

    try {
        await processedDbInstance.run('BEGIN TRANSACTION');
        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const raw of plants) {
          const code = raw.code?.trim();
          const isPlant = !!raw.isPlant;
          const isPlanningPlant = !!raw.isPlanningPlant;
          const isManufacturingPlant = !!raw.isManufacturingPlant;
        
          if (!code) {
            console.warn('❌ Skipping plant entry due to missing code:', raw);
            continue;
          }
        
            const prefix = code.slice(0, 2);
            let coords = geoMapping[prefix];
            let defaulted = 0;

            if (!coords || coords.length < 2) {
                coords = [55.9429, 9.1257]; // Default to Brande
                defaulted = 1;
            }

            const [lat, lon] = coords;

            const existing = await processedDbInstance.get(
                `SELECT IsPlant, IsPlanningPlant, IsManufacturingPlant FROM Plant WHERE Plant_Name = ?`,
                [code]
            );

            const finalIsPlant = isPlant || (existing?.IsPlant ?? 0);
            const finalIsPlanningPlant = isPlanningPlant || (existing?.IsPlanningPlant ?? 0);
            const finalIsManufacturingPlant = isManufacturingPlant || (existing?.IsManufacturingPlant ?? 0);

            const query = `
              INSERT INTO Plant (Plant_Name, Plant_Latitude, Plant_Longitude, Defaulted, IsPlant, IsPlanningPlant, IsManufacturingPlant)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(Plant_Name) DO UPDATE SET
                Plant_Latitude = excluded.Plant_Latitude,
                Plant_Longitude = excluded.Plant_Longitude,
                Defaulted = excluded.Defaulted,
                IsPlant = IsPlant OR excluded.IsPlant,
                IsPlanningPlant = IsPlanningPlant OR excluded.IsPlanningPlant,
                IsManufacturingPlant = IsManufacturingPlant OR excluded.IsManufacturingPlant
            `;

            const values = [
                code,
                lat,
                lon,
                defaulted,
                finalIsPlant ? 1 : 0,
                finalIsPlanningPlant ? 1 : 0,
                finalIsManufacturingPlant ? 1 : 0
            ];

            await processedDbInstance.run(query, values);
            await Predictions_DataDbInstance.run(query, values);
        }

        await processedDbInstance.run('COMMIT');
        await Predictions_DataDbInstance.run('COMMIT');

        res.status(200).json({
            success: true,
            message: '✅ Plant table updated with roles & coordinates'
        });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        await Predictions_DataDbInstance.run('ROLLBACK');

        console.error('❌ Error syncing plant roles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync plant roles',
            error: error.message
        });
    }
};

export const syncMaterialData = async (req, res) => {
    const { materials } = req.body;

    if (!Array.isArray(materials)) {
        return res.status(400).json({ success: false, message: "Invalid materials list" });
    }

    try {
        await processedDbInstance.run("BEGIN TRANSACTION");
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const materialCode of materials) {
            const source = await processedDbInstance.get(
                `SELECT Material, MaterialCategory, Description, BatchManagementPlant, ViolationReplacementPart, Serial_No_Profile
                 FROM MaterialData WHERE Material = ? LIMIT 1`,
                [materialCode]
            );

            if (!source) {
                console.warn(`⚠️ Material '${materialCode}' not found in MaterialData`);
                continue;
            }

            const isBatchManaged = !!(source.BatchManagementPlant && source.BatchManagementPlant.trim());

            const insertMaterialQuery = `
                INSERT INTO Material (
                    Material_A9B_Number,
                    MaterialCategory,
                    Material_Description,
                    Is_Batch_Managed
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(Material_A9B_Number) DO UPDATE SET
                    MaterialCategory = excluded.MaterialCategory,
                    Material_Description = excluded.Material_Description,
                    Is_Batch_Managed = excluded.Is_Batch_Managed
            `;

            const values = [
                source.Material,
                source.MaterialCategory,
                source.Description,
                isBatchManaged ? 1 : 0
            ];

            await processedDbInstance.run(insertMaterialQuery, values);
            await Predictions_DataDbInstance.run(insertMaterialQuery, values);

            // ✅ Insert into ReplacementPart table only if ViolationReplacementPart == 1
            if (String(source.ViolationReplacementPart).trim() === '1') {
                const materialRow = await processedDbInstance.get(
                    'SELECT Material_ID FROM Material WHERE Material_A9B_Number = ?',
                    [source.Material]
                );

                if (materialRow) {
                    await processedDbInstance.run(
                        `INSERT OR IGNORE INTO ReplacementPart (Material_ID)
                         VALUES (?)`,
                        [materialRow.Material_ID]
                    );

                    await Predictions_DataDbInstance.run(
                        `INSERT OR IGNORE INTO ReplacementPart (Material_ID)
                         VALUES (?)`,
                        [materialRow.Material_ID]
                    );
                } else {
                    console.warn(`⚠️ Material not found in Material table for ReplacementPart: ${source.Material}`);
                }
            }

            // ✅ Insert into SerialNumberProfile if Serial_No_Profile exists
            if (source.Serial_No_Profile && source.Serial_No_Profile.trim()) {
                const materialRow = await processedDbInstance.get(
                    'SELECT Material_ID FROM Material WHERE Material_A9B_Number = ?',
                    [source.Material]
                );

                if (materialRow) {
                    const materialId = materialRow.Material_ID;
                    const insertSerialQuery = `
                        INSERT INTO SerialNumberProfile (Material_ID, Tracking_Number)
                        VALUES (?, ?)
                        ON CONFLICT(Material_ID) DO UPDATE SET
                            Tracking_Number = excluded.Tracking_Number
                    `;

                    const trackingNumber = source.Serial_No_Profile.trim();

                    await processedDbInstance.run(insertSerialQuery, [materialId, trackingNumber]);
                    await Predictions_DataDbInstance.run(insertSerialQuery, [materialId, trackingNumber]);
                } else {
                    console.warn(`⚠️ Could not resolve Material_ID for SerialNumberProfile: ${source.Material}`);
                }
            }
        }

        await processedDbInstance.run("COMMIT");
        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: "✅ Material, ReplacementPart, and SerialNumberProfile tables synced successfully"
        });
    } catch (err) {
        await processedDbInstance.run("ROLLBACK");
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error("❌ Error syncing Material numbers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to sync Material numbers",
            error: err.message,
        });
    }
};

export const syncTurbineData = async (req, res) => {
    try {
        const turbineLocations = await processedDbInstance.all(
            `SELECT DISTINCT FunctionalLoc FROM TurbineData WHERE FunctionalLoc IS NOT NULL AND TRIM(FunctionalLoc) != ''`
        );

        if (!turbineLocations || turbineLocations.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No turbine locations found to sync.'
            });
        }

        await processedDbInstance.run("BEGIN TRANSACTION");
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const { FunctionalLoc } of turbineLocations) {
            // Insert into Location table if not already present
            const query = `
                INSERT OR IGNORE INTO Location (Location_Name)
                VALUES (?)
            `;

            await processedDbInstance.run(query, [FunctionalLoc]);
            await Predictions_DataDbInstance.run(query, [FunctionalLoc]);
        }

        await processedDbInstance.run("COMMIT");
        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: "✅ Location table synced successfully with FunctionalLoc values"
        });
    } catch (err) {
        await processedDbInstance.run("ROLLBACK");
        await Predictions_DataDbInstance.run("ROLLBACK");

        console.error("❌ Error syncing turbine locations:", err);
        res.status(500).json({
            success: false,
            message: "Failed to sync turbine locations",
            error: err.message
        });
    }
};

export const syncFaultReportsController = async (req, res) => {
    try {
        await syncFaultReports(processedDbInstance, Predictions_DataDbInstance);
        res.status(200).json({ success: true, message: '✅ FaultReports synced from ReplacementParts' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const syncFaultReports = async (processedDbInstance, Predictions_DataDbInstance) => {
    const dbs = [
        { name: 'processedDb', instance: processedDbInstance },
        { name: 'PredictionsDb', instance: Predictions_DataDbInstance }
    ];

    for (const { name, instance: db } of dbs) {
        try {
            await db.run('BEGIN TRANSACTION');
            console.log(`🔄 Starting sync from MaterialData for ${name}`);

            const materialsWithB = await db.all(`
                SELECT md.Material, md.Plant, m.Material_ID
                FROM MaterialData md
                JOIN Material m ON m.Material_A9B_Number = md.Material
                WHERE md.ReplacementPart = 'B'
            `);

            console.log(`🔍 Found ${materialsWithB.length} MaterialData rows with ReplacementPart = 'B'`);

            for (const row of materialsWithB) {
                console.log(`🔁 Checking Material ${row.Material} for Plant ${row.Plant}`);

                const turbines = await db.all(`
                    SELECT FunctionalLoc FROM TurbineData
                    WHERE MaintPlant = ?
                `, [row.Plant]);

                console.log(`⚙️ Found ${turbines.length} turbines for Plant ${row.Plant}`);

                for (const turbine of turbines) {
                    const location = await db.get(`
                        SELECT Location_ID FROM Location
                        WHERE Location_Name = ?
                    `, [turbine.FunctionalLoc]);

                    if (!location) {
                        console.warn(`⚠️ No Location for FunctionalLoc = ${turbine.FunctionalLoc}`);
                        continue;
                    }

                    const exists = await db.get(`
                        SELECT 1 FROM FaultReport
                        WHERE TurbineLocation = ? AND Material_ID = ? AND Fault_Type = 'Replacement Part'
                    `, [location.Location_ID, row.Material_ID]);

                    if (!exists) {
                        await db.run(`
                            INSERT INTO FaultReport (
                                Technician_ID,
                                TurbineLocation,
                                Report_Date,
                                Fault_Type,
                                Material_ID,
                                Report_Status,
                                Updated_Time,
                                Attachment
                            ) VALUES (
                                NULL, ?, DATE('now'), 'Replacement Part', ?, 'Open', CURRENT_TIMESTAMP, NULL
                            )
                        `, [location.Location_ID, row.Material_ID]);

                        console.log(`✅ Inserted FaultReport: Turbine ${location.Location_ID}, Material ${row.Material_ID}`);
                    }
                }
            }

            await db.run('COMMIT');
            console.log(`✅ COMMIT complete for ${name}`);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error(`❌ Error syncing fault reports in ${name}:`, error.message);
            throw error;
        }
    }
};


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
                    console.log(`Updating: ${record.FunctionalLoc}`);
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
                    console.log(`Inserting: ${record.FunctionalLoc}`);
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

        for (const record of cleanedData) {
            // Check if the record already exists
            const existing = await processedDbInstance.get(
                `SELECT 1 FROM MaterialData WHERE Material = ? AND Plant = ?`,
                [record.Material, record.Plant]
            );

            if (existing) {
                // If exists, update only the necessary fields
                await processedDbInstance.run(
                    `UPDATE MaterialData 
                     SET Description = ?, PlantSpecificMaterialStatus = ?, BatchManagementPlant = ?, 
                         Serial_No_Profile = ?, ReplacementPart = ?, UsedInSBom = ?, ViolationReplacementPart = ?, MaterialCategory = ?, UnknownPlant = ?
                     WHERE Material = ? AND Plant = ?`,
                    [
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
                    ]
                );
            } else {
                // If not exists, insert new record
                await processedDbInstance.run(
                    `INSERT INTO MaterialData 
                    (Material, Plant, Description, PlantSpecificMaterialStatus, BatchManagementPlant, 
                    Serial_No_Profile, ReplacementPart, UsedInSBom, ViolationReplacementPart, MaterialCategory, UnknownPlant)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.Material,
                        record.Plant,
                        record.Description,
                        record.PlantSpecificMaterialStatus,
                        record.BatchManagementPlant,
                        record.Serial_No_Profile,
                        record.ReplacementPart,
                        record.UsedInSBom,
                        record.ViolationReplacementPart,
                        record.MaterialCategory,
                        record.UnknownPlant
                    ]
                );
            }
        }

        await processedDbInstance.run('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Cleaned MaterialData successfully persisted'
        });
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

export const verifyTechnicianLinksController = async (req, res) => {
    try {
        const data = await verifyTechnicianLinks(Predictions_DataDbInstance);
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to verify links", error: err.message });
    }
};


export const verifyTechnicianLinks = async (db) => {
    try {
        console.log("🔎 Verifying FaultReport ↔ Technician linkage...");

        const results = await db.all(`
            SELECT
                fr.Report_ID,
                fr.Technician_ID,
                t.Name,
                t.Surname
            FROM FaultReport fr
            LEFT JOIN Technician t ON fr.Technician_ID = t.Technician_ID
            ORDER BY fr.Report_ID
        `);

        if (results.length === 0) {
            console.log("❌ No FaultReports found.");
        } else {
            console.table(results.map(r => ({
                Report_ID: r.Report_ID,
                Technician_ID: r.Technician_ID,
                Name: r.Name || 'NULL',
                Surname: r.Surname || 'NULL'
            })));
        }

        return results;
    } catch (error) {
        console.error("❌ Error verifying technician links:", error.message);
        throw error;
    }
};


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

export const getUnprocessedTurbineData = async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM TurbineData'
        );
        console.log('Unprocessed TurbineData:', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching unprocessed TurbineData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unprocessed TurbineData',
            error: error.message
        });
    }
};

export const getUnprocessedMaterialData = async (req, res) => {
    try {
        const data = await unprocessedDbInstance.all(
            'SELECT * FROM MaterialData'
        );
        console.log('Unprocessed MaterialData:', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching unprocessed MaterialData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unprocessed MaterialData',
            error: error.message
        });
    }
};

export const getProcessedMaterialData = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT * FROM MaterialData'
        );
        console.log('Processed data(Material Data):', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching processed MaterialData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch processed MaterialData',
            error: error.message
        });
    }
};

export const getProcessedTurbineData = async (req, res) => {
    try {
        const data = await processedDbInstance.all('SELECT * FROM TurbineData');
        // console.log('Processed data(Turbine Data):', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching processed TurbineData:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch processed TurbineData',
            error: error.message
        });
    }
};

export const getPredictionsData = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT * FROM TurbineData'
        );
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

export const getTechnicians = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT Technician_ID, Name FROM Technician'
        );
        res.status(200).json({ success: true, data: data || [] }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch technician data',
            error: error.message
        });
    }
};

export const getLocations = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all(
            'SELECT Location_ID, Location_Name FROM Location'
        );
        res.status(200).json({ success: true, data: data || [] }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location data',
            error: error.message
        });
    }
};
