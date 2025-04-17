import { Predictions_DataDbInstance } from '../../Database/Database.js';

export const syncMaterialCategoryPredictionsController = async (req, res) => {
    const { predictions } = req.body;

    if (!Array.isArray(predictions)) {
        return res.status(400).json({ success: false, message: "Invalid predictions array" });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const row of predictions) {
            const category = row.Category?.trim();
            const bayes = Number(row.BayesianProbability ?? 0);
            const monte = Number(row.MonteCarloEstimate ?? 0);
            const p5 = Number(row.MonteCarlo_5th_Percentile ?? 0);
            const p50 = Number(row.MonteCarlo_50th_Percentile ?? 0);
            const p95 = Number(row.MonteCarlo_95th_Percentile ?? 0);

            if (!category) {
                console.warn("Skipping row with missing Category:", row);
                continue;
            }

            await Predictions_DataDbInstance.run(`
                INSERT INTO MaterialCategoryPredictions (
                    Category,
                    BayesianProbability,
                    MonteCarloEstimate,
                    MonteCarlo_5th_Percentile,
                    MonteCarlo_50th_Percentile,
                    MonteCarlo_95th_Percentile
                ) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(Category) DO UPDATE SET
                    BayesianProbability = excluded.BayesianProbability,
                    MonteCarloEstimate = excluded.MonteCarloEstimate,
                    MonteCarlo_5th_Percentile = excluded.MonteCarlo_5th_Percentile,
                    MonteCarlo_50th_Percentile = excluded.MonteCarlo_50th_Percentile,
                    MonteCarlo_95th_Percentile = excluded.MonteCarlo_95th_Percentile
            `, [category, bayes, monte, p5, p50, p95]);
        }

        await Predictions_DataDbInstance.run("COMMIT");
        res.status(200).json({ success: true, message: "Category predictions synced with confidence intervals." });

    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error("Error syncing MaterialCategoryPredictions:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
