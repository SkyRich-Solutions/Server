import { Predictions_DataDbInstance } from '../../Database/Database.js';

export const syncTurbinePlatformHealthScores = async (req, res) => {
    const { platform_scores, summary_scores } = req.body;

    if (!Array.isArray(platform_scores) || !Array.isArray(summary_scores)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload structure."
        });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const entry of platform_scores) {
            const { Platform, Plant, HealthScore, LastUpdated } = entry;

            if (!Platform || !Plant || isNaN(Number(HealthScore))) {
                console.warn("Skipping invalid platform_score entry:", entry);
                continue;
            }

            await Predictions_DataDbInstance.run(`
                INSERT INTO TurbinePlatformHealthScore (
                    Platform, Plant, HealthScore, LastUpdated
                ) VALUES (?, ?, ?, ?)
                ON CONFLICT(Platform, Plant) DO UPDATE SET
                    HealthScore = excluded.HealthScore,
                    LastUpdated = excluded.LastUpdated
            `, [Platform, Plant, HealthScore, LastUpdated]);
        }

        for (const entry of summary_scores) {
            const { Platform, TotalPlatformScore, LastUpdated } = entry;

            if (!Platform || isNaN(Number(TotalPlatformScore))) {
                console.warn("Skipping invalid platform_summary entry:", entry);
                continue;
            }

            await Predictions_DataDbInstance.run(`
                INSERT INTO TurbinePlatformScoreSummary (
                    Platform, TotalPlatformScore, LastUpdated
                ) VALUES (?, ?, ?)
                ON CONFLICT(Platform) DO UPDATE SET
                    TotalPlatformScore = excluded.TotalPlatformScore,
                    LastUpdated = excluded.LastUpdated
            `, [Platform, TotalPlatformScore, LastUpdated]);
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: "Turbine platform health scores synced."
        });

    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error("Error syncing turbine platform health scores:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
