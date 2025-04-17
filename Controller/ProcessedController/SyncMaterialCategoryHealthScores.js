import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncMaterialCategoryHealthScores = async (req, res) => {
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

        // ➤ 1. Update MaterialCategoryHealthScores
        for (const score of plant_scores) {
            const category = score.Category?.toString().trim();
            const plant = score.Plant?.toString().trim();
            const health = Number(score.HealthScore);
            const updated = score.LastUpdated ?? new Date().toISOString();

            if (!category || !plant || isNaN(health)) continue;

            await Predictions_DataDbInstance.run(`
                INSERT INTO MaterialCategoryHealthScores (
                    Category, Plant, HealthScore, LastUpdated
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(Category, Plant) DO UPDATE SET
                    HealthScore = excluded.HealthScore,
                    LastUpdated = excluded.LastUpdated
            `, [category, plant, health, updated]);

            plantInserted++;
        }

        // ➤ 2. Update MaterialCategoryScoreSummary
        for (const summary of summary_scores) {
            const category = summary.Category?.toString().trim();
            const total = Number(summary.TotalCategoryScore);
            const updated = summary.LastUpdated ?? new Date().toISOString();

            if (!category || isNaN(total)) continue;

            await Predictions_DataDbInstance.run(`
                INSERT INTO MaterialCategoryScoreSummary (
                    Category, TotalCategoryScore, LastUpdated
                ) VALUES (?, ?, ?)
                ON CONFLICT(Category) DO UPDATE SET
                    TotalCategoryScore = excluded.TotalCategoryScore,
                    LastUpdated = excluded.LastUpdated
            `, [category, total, updated]);

            summaryInserted++;
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: `Health scores synced from Python backend. Inserted ${plantInserted} plant scores and ${summaryInserted} summary scores.`
        });

    } catch (err) {
        try {
            await Predictions_DataDbInstance.run("ROLLBACK");
        } catch (rollbackErr) {
            console.warn("Rollback skipped or failed:", rollbackErr.message);
        }

        console.error("Error syncing MaterialCategoryHealthScores:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
