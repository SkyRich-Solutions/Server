import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncTurbineData = async (req, res) => {
    try {
        const turbineLocations = await Predictions_DataDbInstance.all(
            `SELECT DISTINCT FunctionalLoc FROM TurbineData WHERE FunctionalLoc IS NOT NULL AND TRIM(FunctionalLoc) != ''`
        );

        if (!turbineLocations || turbineLocations.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No turbine locations found to sync.'
            });
        }

        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const { FunctionalLoc } of turbineLocations) {
            // Insert into Location table if not already present
            const query = `
                INSERT OR IGNORE INTO Location (Location_Name)
                VALUES (?)
            `;

            await Predictions_DataDbInstance.run(query, [FunctionalLoc]);
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: " Location table synced successfully with FunctionalLoc values"
        });
    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");

        console.error(" Error syncing turbine locations:", err);
        res.status(500).json({
            success: false,
            message: "Failed to sync turbine locations",
            error: err.message
        });
    }
};