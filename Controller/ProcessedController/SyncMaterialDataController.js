import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncMaterialData = async (req, res) => {
    const { materials } = req.body;

    if (!Array.isArray(materials)) {
        return res.status(400).json({ success: false, message: "Invalid materials list" });
    }

    let transactionStarted = false;

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");
        transactionStarted = true;

        for (const materialCode of materials) {
            const materialRows = await Predictions_DataDbInstance.all(
                `SELECT Material, MaterialCategory, Description, ViolationReplacementPart, Serial_No_Profile, Plant
                 FROM MaterialData
                 WHERE Material = ?`,
                [materialCode]
            );

            if (!materialRows || materialRows.length === 0) {
                console.warn(`Material '${materialCode}' not found in MaterialData`);
                continue;
            }

            const firstRow = materialRows[0]; // all rows share MaterialCategory, Description
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
                firstRow.Material,
                firstRow.MaterialCategory,
                firstRow.Description,
                0
            ];

            await Predictions_DataDbInstance.run(insertMaterialQuery, values);

            const materialRow = await Predictions_DataDbInstance.get(
                'SELECT Material_ID FROM Material WHERE Material_A9B_Number = ?',
                [firstRow.Material]
            );

            if (!materialRow) {
                console.warn(`Material not found in Material table: ${firstRow.Material}`);
                continue;
            }

            const materialId = materialRow.Material_ID;

            // Serial Number Profile (only once)
            if (firstRow.Serial_No_Profile && firstRow.Serial_No_Profile.trim()) {
                const insertSerialQuery = `
                    INSERT INTO SerialNumberProfile (Material_ID, Tracking_Number)
                    VALUES (?, ?)
                    ON CONFLICT(Material_ID) DO UPDATE SET
                        Tracking_Number = excluded.Tracking_Number
                `;
                await Predictions_DataDbInstance.run(insertSerialQuery, [
                    materialId,
                    firstRow.Serial_No_Profile.trim()
                ]);
            }

            // ReplacementPart per unique Plant
            for (const row of materialRows) {
                const plantName = row.Plant?.trim();
                const violation = row.ViolationReplacementPart === '1';

                if (!violation) continue;

                if (!plantName) {
                    console.warn(`No Plant specified for '${row.Material}'`);
                    continue;
                }

                const plantRow = await Predictions_DataDbInstance.get(
                    `SELECT Plant_ID FROM Plant WHERE Plant_Name = ? COLLATE NOCASE`,
                    [plantName]
                );

                if (!plantRow) {
                    console.warn(`Plant '${plantName}' not found for Material '${row.Material}'`);
                    continue;
                }

                const plantId = plantRow.Plant_ID;

                const insertReplacementPartQuery = `
                INSERT INTO ReplacementPart (Material_ID, Plant_ID, ReplacementReason, Timestamp)
                VALUES (?, ?, 'Replacement Part', ?)
                ON CONFLICT(Material_ID, Plant_ID) DO UPDATE SET
                    ReplacementReason = excluded.ReplacementReason
            `;
            
            const timestamp = new Date().toISOString();
            await Predictions_DataDbInstance.run(insertReplacementPartQuery, [materialId, plantId, timestamp]);
            
            }
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: "Material, ReplacementPart, and SerialNumberProfile tables synced successfully"
        });
    } catch (err) {
        if (transactionStarted) {
            await Predictions_DataDbInstance.run("ROLLBACK");
        }
        console.error("Error syncing Material numbers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to sync Material numbers",
            error: err.message
        });
    }
};
