import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncTurbineModelHealthScores = async (req, res) => {
    const { model_scores, summary_scores } = req.body;

    if (!Array.isArray(model_scores) || !Array.isArray(summary_scores)) {
        console.warn("syncTurbineModelHealthScores: Invalid payload structure.");
        return res.status(400).json({
            success: false,
            message: "Invalid payload. Expected model_scores and summary_scores arrays."
        });
    }

    let modelInserted = 0;
    let summaryInserted = 0;

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        // Insert/Update Model Scores
        for (const entry of model_scores) {
            try {
                const { TurbineModel, Plant, HealthScore, LastUpdated } = entry;

                if (!TurbineModel || !Plant || isNaN(Number(HealthScore))) {
                    console.warn("Skipped invalid model_score row:", entry);
                    continue;
                }

                await Predictions_DataDbInstance.run(`
                    INSERT INTO TurbineModelHealthScore (TurbineModel, Plant, HealthScore, LastUpdated)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(TurbineModel, Plant) DO UPDATE SET
                        HealthScore = excluded.HealthScore,
                        LastUpdated = excluded.LastUpdated
                `, [TurbineModel, Plant, HealthScore, LastUpdated]);
                
                modelInserted++;
            } catch (err) {
                console.error("Model Score insert failed for entry:", entry, err);
                throw err;
            }
        }

        // Insert/Update Summary Scores
        for (const entry of summary_scores) {
            try {
                const { TurbineModel, TotalModelScore, LastUpdated } = entry;

                if (!TurbineModel || isNaN(Number(TotalModelScore))) {
                    console.warn("Skipped invalid summary_score row:", entry);
                    continue;
                }

                await Predictions_DataDbInstance.run(`
                    INSERT INTO TurbineModelScoreSummary (TurbineModel, TotalModelScore, LastUpdated)
                    VALUES (?, ?, ?)
                    ON CONFLICT(TurbineModel) DO UPDATE SET
                        TotalModelScore = excluded.TotalModelScore,
                        LastUpdated = excluded.LastUpdated
                `, [TurbineModel, TotalModelScore, LastUpdated]);

                summaryInserted++;
            } catch (err) {
                console.error("Summary Score insert failed for entry:", entry, err);
                throw err;
            }
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: `TurbineModelHealthScores synced: ${modelInserted} model entries, ${summaryInserted} summaries.`
        });

    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error("Error syncing turbine model health scores:", err);
        res.status(500).json({
            success: false,
            message: "Failed to sync turbine model health scores: " + err.message
        });
    }
};

