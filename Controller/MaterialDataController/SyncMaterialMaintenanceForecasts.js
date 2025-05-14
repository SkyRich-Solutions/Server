import { Predictions_DataDbInstance } from '../../Database/Database.js';

export const syncMaterialMaintenanceForecasts = async (req, res) => {
    const { forecasts } = req.body;

    if (!Array.isArray(forecasts)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payload. Expected 'forecasts' array."
        });
    }

    if (forecasts.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No forecasts to sync (empty list)."
        });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        let inserted = 0;

        for (const row of forecasts) {
            const {
                Material_ID,
                Plant_ID,
                LastMaintenance,
                AverageIntervalDays,
                NextEstimatedMaintenanceDate
            } = row;

            if (
                typeof Material_ID !== "number" ||
                typeof Plant_ID !== "number" ||
                AverageIntervalDays == null ||
                isNaN(AverageIntervalDays)
            ) {
                console.warn(`Skipping invalid forecast row:`, row);
                continue;
            }

            // Patch to ensure clean ISO format or NULL
            const safeLast = isValidISODate(LastMaintenance) ? LastMaintenance : null;
            const safeNext = isValidISODate(NextEstimatedMaintenanceDate) ? NextEstimatedMaintenanceDate : null;

            await Predictions_DataDbInstance.run(
                `
                INSERT INTO MaintenanceForecasts (
                    Material_ID,
                    Plant_ID,
                    LastMaintenance,
                    AverageIntervalDays,
                    NextEstimatedMaintenanceDate
                ) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(Material_ID, Plant_ID) DO UPDATE SET
                    LastMaintenance = excluded.LastMaintenance,
                    AverageIntervalDays = excluded.AverageIntervalDays,
                    NextEstimatedMaintenanceDate = excluded.NextEstimatedMaintenanceDate
                `,
                [
                    Material_ID,
                    Plant_ID,
                    safeLast,
                    Math.round(AverageIntervalDays),
                    safeNext
                ]
            );

            inserted++;
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: `Synced ${inserted} maintenance forecast entries`
        });

    } catch (err) {
        try {
            await Predictions_DataDbInstance.run("ROLLBACK");
        } catch (rollbackErr) {
            console.warn("Rollback failed or skipped:", rollbackErr.message);
        }

        console.error("Error syncing MaintenanceForecasts:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

// Utility to validate ISO strings
function isValidISODate(str) {
    if (typeof str !== "string") return false;
    const date = new Date(str);
    return !isNaN(date.getTime());
}
