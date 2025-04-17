import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncReplacementPredictionsController = async (req, res) => {
    try {
        await syncReplacementPredictions(req.body);
        res.status(200).json({ success: true, message: ' Replacement predictions synced successfully' });
    } catch (err) {
        console.error(" Error in syncReplacementPredictionsController:", err);
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

            // ➤ 1. Global predictions (overall)
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

                // ➤ 1b. Patch Material table with global prediction data
                await db.run(`
                    UPDATE Material
                    SET
                        TotalReplacementCount = (
                            SELECT Count_B
                            FROM ReplacementPredictionGlobal
                            WHERE ReplacementPredictionGlobal.Material_ID = Material.Material_ID
                        ),
                        Future_Replacement_Probability = (
                            SELECT BayesianProbability
                            FROM ReplacementPredictionGlobal
                            WHERE ReplacementPredictionGlobal.Material_ID = Material.Material_ID
                        ),
                        TotalUsageCount = (
                            SELECT Total_Count
                            FROM ReplacementPredictionGlobal
                            WHERE ReplacementPredictionGlobal.Material_ID = Material.Material_ID
                        )
                    WHERE EXISTS (
                        SELECT 1
                        FROM ReplacementPredictionGlobal
                        WHERE ReplacementPredictionGlobal.Material_ID = Material.Material_ID
                    )
                `);
            }

            // ➤ 2. Plant-scoped predictions
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

            // ➤ 3. Monte Carlo dominance
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
        } catch (error) {
            await db.run('ROLLBACK');
            console.error(` Error syncing ReplacementPrediction in ${name}:`, error.message);
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
        res.status(200).json({ success: true, message: " MonteCarloDominance synced successfully" });

    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error(" Error syncing MonteCarloDominance:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export const syncReplacementTrendsController = async (req, res) => {
    const { trends } = req.body;

    if (!Array.isArray(trends)) {
        console.warn(" Invalid trends payload received");
        return res.status(400).json({ success: false, message: "Invalid trends data" });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const trend of trends) {
            const { Timestamp, Description, Count } = trend;

            if (!Timestamp || !Description || typeof Count !== "number") {
                console.warn(` Skipping invalid trend entry:`, trend);
                continue;
            }

            const prediction = await Predictions_DataDbInstance.get(
                `SELECT Prediction_ID FROM ReplacementPrediction
                 WHERE Material_Description = ? ORDER BY Timestamp DESC LIMIT 1`,
                [Description]
            );

            const predictionId = prediction?.Prediction_ID || null;

            if (!predictionId) {
                console.warn(` No ReplacementPrediction found for '${Description}'`);
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
        }

        await Predictions_DataDbInstance.run("COMMIT");
        res.status(200).json({ success: true, message: " Replacement trends synced successfully." });
    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error(" Error syncing trends:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};