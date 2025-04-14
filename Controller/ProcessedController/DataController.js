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
                `SELECT Material, MaterialCategory, Description, ViolationReplacementPart, Serial_No_Profile, Plant
                 FROM MaterialData WHERE Material = ? LIMIT 1`,
                [materialCode]
            );

            if (!source) {
                console.warn(`⚠️ Material '${materialCode}' not found in MaterialData`);
                continue;
            }

            const violationReplacementPart = source.ViolationReplacementPart === '1';

            const insertMaterialQuery = `
                INSERT INTO Material (
                    Material_A9B_Number,
                    MaterialCategory,
                    Material_Description,
                    Is_Batch_Managed,
                    Future_Replacement_Probability,
                    TotalReplacementCount,
                    TotalUsageCount
                ) VALUES (?, ?, ?, ?, NULL, 0, 0)
                ON CONFLICT(Material_A9B_Number) DO UPDATE SET
                    MaterialCategory = excluded.MaterialCategory,
                    Material_Description = excluded.Material_Description,
                    Is_Batch_Managed = excluded.Is_Batch_Managed
            `;

            const values = [
                source.Material,
                source.MaterialCategory,
                source.Description,
                0
            ];

            await processedDbInstance.run(insertMaterialQuery, values);
            await Predictions_DataDbInstance.run(insertMaterialQuery, values);

            const materialRow = await processedDbInstance.get(
                'SELECT Material_ID FROM Material WHERE Material_A9B_Number = ?',
                [source.Material]
            );

            if (!materialRow) {
                console.warn(`⚠️ Material not found in Material table: ${source.Material}`);
                continue;
            }

            const materialId = materialRow.Material_ID;

            if (violationReplacementPart) {
                const plantName = source.Plant?.trim();

                if (!plantName) {
                    console.warn(`⚠️ No Plant specified for Material ${source.Material}`);
                    continue;
                }

                const plantRow = await processedDbInstance.get(
                    `SELECT Plant_ID FROM Plant WHERE Plant_Name = ? COLLATE NOCASE`,
                    [plantName]
                );                

                if (!plantRow) {
                    console.warn(`⚠️ Plant '${plantName}' not found in Plant table for Material '${source.Material}'`);
                    continue;
                }

                const plantId = plantRow.Plant_ID;

                const insertReplacementPartQuery = `
                    INSERT OR IGNORE INTO ReplacementPart (Material_ID, Plant_ID)
                    VALUES (?, ?)
                `;

                await processedDbInstance.run(insertReplacementPartQuery, [materialId, plantId]);
                await Predictions_DataDbInstance.run(insertReplacementPartQuery, [materialId, plantId]);

            }

            if (source.Serial_No_Profile && source.Serial_No_Profile.trim()) {
                const insertSerialQuery = `
                    INSERT INTO SerialNumberProfile (Material_ID, Tracking_Number)
                    VALUES (?, ?)
                    ON CONFLICT(Material_ID) DO UPDATE SET
                        Tracking_Number = excluded.Tracking_Number
                `;

                await processedDbInstance.run(insertSerialQuery, [materialId, source.Serial_No_Profile.trim()]);
                await Predictions_DataDbInstance.run(insertSerialQuery, [materialId, source.Serial_No_Profile.trim()]);
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

            const materialsWithB = await db.all(`
                SELECT md.Material, md.Plant, md.ReplacementPart, m.Material_ID
                FROM MaterialData md
                JOIN Material m ON m.Material_A9B_Number = md.Material
                WHERE md.ReplacementPart = 'B'
            `);

            for (const row of materialsWithB) {
                if (!row.Material_ID) {
                    continue;
                }

                const turbines = await db.all(`
                    SELECT FunctionalLoc FROM TurbineData
                    WHERE MaintPlant = ?
                `, [row.Plant]);

                if (turbines.length === 0) {
                    continue;
                }

                for (const turbine of turbines) {

                    await db.run(
                        `INSERT OR IGNORE INTO Location (Location_Name) VALUES (?)`,
                        [turbine.FunctionalLoc]
                    );

                    const location = await db.get(`
                        SELECT Location_ID FROM Location
                        WHERE Location_Name = ?
                    `, [turbine.FunctionalLoc]);

                    if (!location) {
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


export const syncReplacementPredictionsController = async (req, res) => {
    try {
        await syncReplacementPredictions(req.body);
        res.status(200).json({ success: true, message: '✅ Replacement predictions synced successfully' });
    } catch (err) {
        console.error("❌ Error in syncReplacementPredictionsController:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const syncReplacementPredictions = async (insights) => {
    const dbs = [
        { name: 'PredictionsDb', instance: Predictions_DataDbInstance }
    ];

    for (const { name, instance: db } of dbs) {
        try {
            await db.run('BEGIN TRANSACTION');

            // 🌍 Global predictions (overall)
            if (Array.isArray(insights.overall)) {
                for (const row of insights.overall) {
                    const description = row.Description?.trim();
                    const total = Number(row.Total_Count ?? 0);
                    const countB = Number(row.Count_B ?? 0);
                    const bayesProb = Number(row.Probability ?? -1);
                    const mcMean = Number(row.MonteCarloProbability ?? -1);
                    const mcStd = Number(row.MonteCarlo_StdDev ?? -1);
                    const mc5 = Number(row.MonteCarlo_5thPercentile ?? -1);
                    const mc95 = Number(row.MonteCarlo_95thPercentile ?? -1);

                    if (!description || isNaN(bayesProb)) continue;

                    const material = await db.get(
                        `SELECT Material_ID, MaterialCategory FROM Material WHERE Material_Description = ?`,
                        [description]
                    );
                    if (!material) continue;

                    await db.run(
                        `INSERT INTO ReplacementPredictionGlobal (
                            Material_ID, Material_Description, MaterialCategory,
                            Total_Count, Count_B,
                            BayesianProbability, MonteCarloProbability,
                            MonteCarlo_5thPercentile, MonteCarlo_95thPercentile, MonteCarlo_StdDev
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(Material_ID, MaterialCategory) DO UPDATE SET
                            Material_Description = excluded.Material_Description,
                            Total_Count = excluded.Total_Count,
                            Count_B = excluded.Count_B,
                            BayesianProbability = excluded.BayesianProbability,
                            MonteCarloProbability = excluded.MonteCarloProbability,
                            MonteCarlo_5thPercentile = excluded.MonteCarlo_5thPercentile,
                            MonteCarlo_95thPercentile = excluded.MonteCarlo_95thPercentile,
                            MonteCarlo_StdDev = excluded.MonteCarlo_StdDev,
                            Timestamp = CURRENT_TIMESTAMP`,
                        [
                            material.Material_ID,
                            description,
                            material.MaterialCategory?.trim() || null,
                            total,
                            countB,
                            bayesProb,
                            mcMean,
                            mc5,
                            mc95,
                            mcStd
                        ]
                    );
                }
            }

            // 🏭 Plant-scoped predictions
            if (Array.isArray(insights.by_plant)) {
                for (const row of insights.by_plant) {
                    const description = row.Description?.trim();
                    const plantName = row.Plant?.trim() || null;
                    const total = Number(row.Total_Count ?? 0);
                    const countB = Number(row.Count_B ?? 0);
                    const bayesProb = Number(row.Probability ?? -1);
                    const mcMean = Number(row.MonteCarloProbability ?? -1);
                    const mcStd = Number(row.MonteCarlo_StdDev ?? -1);
                    const mc5 = Number(row.MonteCarlo_5thPercentile ?? -1);
                    const mc95 = Number(row.MonteCarlo_95thPercentile ?? -1);

                    if (!description || isNaN(bayesProb)) continue;

                    const material = await db.get(
                        `SELECT Material_ID, MaterialCategory FROM Material WHERE Material_Description = ?`,
                        [description]
                    );
                    if (!material) continue;

                    const plantRow = plantName
                        ? await db.get(`SELECT Plant_ID FROM Plant WHERE Plant_Name = ?`, [plantName])
                        : null;

                    if (!plantRow) continue;

                    await db.run(
                        `INSERT INTO ReplacementPrediction (
                            Material_ID, Material_Description, Plant_ID, MaterialCategory,
                            Total_Count, Count_B,
                            BayesianProbability, MonteCarloProbability,
                            MonteCarlo_5thPercentile, MonteCarlo_95thPercentile, MonteCarlo_StdDev
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(Material_ID, Plant_ID, MaterialCategory) DO UPDATE SET
                            Material_Description = excluded.Material_Description,
                            Total_Count = excluded.Total_Count,
                            Count_B = excluded.Count_B,
                            BayesianProbability = excluded.BayesianProbability,
                            MonteCarloProbability = excluded.MonteCarloProbability,
                            MonteCarlo_5thPercentile = excluded.MonteCarlo_5thPercentile,
                            MonteCarlo_95thPercentile = excluded.MonteCarlo_95thPercentile,
                            MonteCarlo_StdDev = excluded.MonteCarlo_StdDev,
                            Timestamp = CURRENT_TIMESTAMP`,
                        [
                            material.Material_ID,
                            description,
                            plantRow.Plant_ID,
                            material.MaterialCategory?.trim() || null,
                            total,
                            countB,
                            bayesProb,
                            mcMean,
                            mc5,
                            mc95,
                            mcStd
                        ]
                    );
                }
            }

            // 🥊 Monte Carlo dominance
            const dominance = insights?.monte_carlo_simulation;
            if (Array.isArray(dominance)) {
                for (const row of dominance) {
                    const description = row.Description?.trim();
                    const count = Number(row.DominanceCount ?? 0);
                    const percentage = Number(row.Percentage ?? 0);
                    if (!description) continue;

                    await db.run(
                        `INSERT INTO MonteCarloDominance (
                            Description, DominanceCount, Percentage
                        ) VALUES (?, ?, ?)
                        ON CONFLICT(Description) DO UPDATE SET
                            DominanceCount = excluded.DominanceCount,
                            Percentage = excluded.Percentage,
                            Timestamp = CURRENT_TIMESTAMP`,
                        [description, count, percentage]
                    );
                }
            }

            await db.run('COMMIT');
            console.log(`✅ ReplacementPrediction + ReplacementPredictionGlobal + MonteCarloDominance synced for ${name}`);
        } catch (error) {
            await db.run('ROLLBACK');
            console.error(`❌ Error syncing ReplacementPrediction in ${name}:`, error.message);
            throw error;
        }
    }
};


export const syncMonteCarloDominanceController = async (req, res) => {
    const { dominance } = req.body;

    if (!Array.isArray(dominance)) {
        return res.status(400).json({ success: false, message: "Invalid dominance array" });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const row of dominance) {
            const description = row.Description?.trim();
            const count = Number(row.DominanceCount ?? 0);
            const percentage = Number(row.Percentage ?? 0);

            if (!description) {
                console.warn(`⚠️ Skipping row with missing Description:`, row);
                continue;
            }

            await Predictions_DataDbInstance.run(`
                INSERT INTO MonteCarloDominance (
                    Description, DominanceCount, Percentage
                ) VALUES (?, ?, ?)
                ON CONFLICT(Description) DO UPDATE SET
                    DominanceCount = excluded.DominanceCount,
                    Percentage = excluded.Percentage,
                    Timestamp = CURRENT_TIMESTAMP
            `, [description, count, percentage]);
        }

        await Predictions_DataDbInstance.run("COMMIT");
        res.status(200).json({ success: true, message: "✅ MonteCarloDominance synced successfully" });

    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error("❌ Error syncing MonteCarloDominance:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const syncReplacementTrendsController = async (req, res) => {
    const { trends } = req.body;

    if (!Array.isArray(trends)) {
        console.warn("❌ Invalid trends payload received");
        return res.status(400).json({ success: false, message: "Invalid trends data" });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");
        console.log(`📊 Syncing ${trends.length} replacement trend rows...`);

        // 🔍 DEBUG: Check if ReplacementPrediction has valid entries
        const sample = await Predictions_DataDbInstance.all(`SELECT * FROM ReplacementPrediction LIMIT 5`);
        console.log("📄 Sample predictions:", sample);

        for (const trend of trends) {
            const { Timestamp, Description, Count } = trend;

            if (!Timestamp || !Description || typeof Count !== "number") {
                console.warn(`⚠️ Skipping invalid trend entry:`, trend);
                continue;
            }

            console.log(`🔍 Looking up Prediction_ID for '${Description}'...`);

            const prediction = await Predictions_DataDbInstance.get(
                `SELECT Prediction_ID FROM ReplacementPrediction
                 WHERE Material_Description = ? ORDER BY Timestamp DESC LIMIT 1`,
                [Description]
            );

            const predictionId = prediction?.Prediction_ID || null;

            if (!predictionId) {
                console.warn(`⚠️ No ReplacementPrediction found for '${Description}'`);
            } else {
                console.log(`✅ Found Prediction_ID ${predictionId} for '${Description}'`);
            }

            await Predictions_DataDbInstance.run(
                `INSERT INTO ReplacementTrends (
                    Timestamp, Description, Count, Prediction_ID
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(Timestamp, Description) DO UPDATE SET
                    Count = excluded.Count,
                    Prediction_ID = excluded.Prediction_ID`,
                [Timestamp, Description, Count, predictionId]
            );

            console.log(`📌 Inserted/Updated trend: ${Timestamp}, ${Description}, Count: ${Count}, Prediction_ID: ${predictionId}`);
        }

        await Predictions_DataDbInstance.run("COMMIT");
        console.log("✅ Replacement trends sync committed.");
        res.status(200).json({ success: true, message: "📈 Replacement trends synced successfully." });
    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error("❌ Error syncing trends:", err);
        res.status(500).json({ success: false, error: err.message });
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
