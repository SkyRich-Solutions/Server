import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncMaterialComponentHealthScores = async (req, res) => {
    const { plant_scores, summary_scores } = req.body;

    if (!Array.isArray(plant_scores) || !Array.isArray(summary_scores)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload. Expected 'plant_scores' and 'summary_scores' arrays."
        });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        let plantInserted = 0;
        let summaryInserted = 0;

        // ➤ 1. Update MaterialComponentHealthScore
        for (const score of plant_scores) {
            const material_id = score.Material_ID?.toString().trim();
            const plant = score.Plant?.toString().trim();
            const health = Number(score.HealthScore);
            const updated = score.LastUpdated ?? new Date().toISOString();

            if (!material_id || !plant || isNaN(health)) continue;

            await Predictions_DataDbInstance.run(`
                INSERT INTO MaterialComponentHealthScore (
                    Material_ID, Plant, HealthScore, LastUpdated
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(Material_ID, Plant) DO UPDATE SET
                    HealthScore = excluded.HealthScore,
                    LastUpdated = excluded.LastUpdated
            `, [material_id, plant, health, updated]);

            plantInserted++;
        }

        // ➤ 2. Update MaterialComponentScoreSummary
        for (const summary of summary_scores) {
            const material_id = summary.Material_ID?.toString().trim();
            const total = Number(summary.TotalComponentScore);
            const updated = summary.LastUpdated ?? new Date().toISOString();

            if (!material_id || isNaN(total)) continue;

            await Predictions_DataDbInstance.run(`
                INSERT INTO MaterialComponentScoreSummary (
                    Material_ID, TotalComponentScore, LastUpdated
                ) VALUES (?, ?, ?)
                ON CONFLICT(Material_ID) DO UPDATE SET
                    TotalComponentScore = excluded.TotalComponentScore,
                    LastUpdated = excluded.LastUpdated
            `, [material_id, total, updated]);

            summaryInserted++;
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: `Component health scores synced. Inserted ${plantInserted} plant scores and ${summaryInserted} summary scores.`
        });

    } catch (err) {
        try {
            await Predictions_DataDbInstance.run("ROLLBACK");
        } catch (rollbackErr) {
            console.warn("Rollback skipped or failed:", rollbackErr.message);
        }

        console.error("Error syncing MaterialComponentHealthScores:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
