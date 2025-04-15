
import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';

export const syncMaterialData = async (req, res) => {
    const { materials } = req.body;

    if (!Array.isArray(materials)) {
        return res.status(400).json({ success: false, message: "Invalid materials list" });
    }

    try {
        await Predictions_DataDbInstance.run("BEGIN TRANSACTION");

        for (const materialCode of materials) {
            const source = await Predictions_DataDbInstance.get(
                `SELECT Material, MaterialCategory, Description, ViolationReplacementPart, Serial_No_Profile, Plant
                 FROM MaterialData WHERE Material = ? LIMIT 1`,
                [materialCode]
            );

            if (!source) {
                console.warn(` Material '${materialCode}' not found in MaterialData`);
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

            await Predictions_DataDbInstance.run(insertMaterialQuery, values);

            const materialRow = await Predictions_DataDbInstance.get(
                'SELECT Material_ID FROM Material WHERE Material_A9B_Number = ?',
                [source.Material]
            );

            if (!materialRow) {
                console.warn(` Material not found in Material table: ${source.Material}`);
                continue;
            }

            const materialId = materialRow.Material_ID;

            if (violationReplacementPart) {
                const plantName = source.Plant?.trim();

                if (!plantName) {
                    console.warn(` No Plant specified for Material ${source.Material}`);
                    continue;
                }

                const plantRow = await Predictions_DataDbInstance.get(
                    `SELECT Plant_ID FROM Plant WHERE Plant_Name = ? COLLATE NOCASE`,
                    [plantName]
                );                

                if (!plantRow) {
                    console.warn(` Plant '${plantName}' not found in Plant table for Material '${source.Material}'`);
                    continue;
                }

                const plantId = plantRow.Plant_ID;

                const insertReplacementPartQuery = `
                    INSERT OR IGNORE INTO ReplacementPart (Material_ID, Plant_ID)
                    VALUES (?, ?)
                `;

                await Predictions_DataDbInstance.run(insertReplacementPartQuery, [materialId, plantId]);

            }

            if (source.Serial_No_Profile && source.Serial_No_Profile.trim()) {
                const insertSerialQuery = `
                    INSERT INTO SerialNumberProfile (Material_ID, Tracking_Number)
                    VALUES (?, ?)
                    ON CONFLICT(Material_ID) DO UPDATE SET
                        Tracking_Number = excluded.Tracking_Number
                `;
                await Predictions_DataDbInstance.run(insertSerialQuery, [materialId, source.Serial_No_Profile.trim()]);
            }
        }

        await Predictions_DataDbInstance.run("COMMIT");

        res.status(200).json({
            success: true,
            message: " Material, ReplacementPart, and SerialNumberProfile tables synced successfully"
        });
    } catch (err) {
        await Predictions_DataDbInstance.run("ROLLBACK");
        console.error(" Error syncing Material numbers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to sync Material numbers",
            error: err.message,
        });
    }
};