import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

const VALID_STATUSES = [
    "Z0", "Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7", "Z8", "Z9",
    "ZI", "ZL", "ZP", "ZR", "ZS"
];

export const syncPlantSpecificMaterialStatusTransitions = async (req, res) => {
    try {
        const rows = await Predictions_DataDbInstance.all(`
            SELECT Material, Plant, Description, PlantSpecificMaterialStatus, Timestamp
            FROM MaterialData
            WHERE Timestamp IS NOT NULL
        `);

        if (!rows || rows.length === 0) {
            return res.status(200).json({ success: true, message: "No data in MaterialData with timestamp." });
        }

        // Step 1: Group by Material + Plant
        const materialMap = {};
        for (const row of rows) {
            const material = row.Material?.trim();
            const plant = row.Plant?.trim();
            const status = row.PlantSpecificMaterialStatus?.trim();
            const description = row.Description?.trim();
            const ts = row.Timestamp?.trim();

            if (!material || !status || !ts || !plant || !VALID_STATUSES.includes(status)) continue;

            const key = `${material}|${plant}`;
            materialMap[key] = materialMap[key] || [];
            materialMap[key].push({ status, timestamp: ts, description, plant });
        }

        // Step 2: Detect transitions with direction
        const transitions = [];

        for (const [key, entries] of Object.entries(materialMap)) {
            entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            if (entries.length === 1) {
                const e = entries[0];
                transitions.push({
                    Material: key.split("|")[0],
                    Plant: e.plant,
                    Description: e.description,
                    PrevStatus: e.status,
                    PlantSpecificMaterialStatus: e.status,
                    TransitionCount: 0,
                    Direction: "none"
                });
                continue;
            }

            let prev = null;
            for (const entry of entries) {
                const curr = entry.status;
                if (prev && VALID_STATUSES.includes(prev) && VALID_STATUSES.includes(curr)) {
                    const fromIdx = VALID_STATUSES.indexOf(prev);
                    const toIdx = VALID_STATUSES.indexOf(curr);
                    const stepCount = Math.abs(toIdx - fromIdx);
                    const direction = toIdx === fromIdx
                        ? "none"
                        : toIdx > fromIdx
                        ? "forward"
                        : "backward";

                    transitions.push({
                        Material: key.split("|")[0],
                        Plant: entry.plant,
                        Description: entry.description,
                        PrevStatus: prev,
                        PlantSpecificMaterialStatus: curr,
                        TransitionCount: stepCount,
                        Direction: direction
                    });
                }
                prev = entry.status;
            }
        }

        // Step 3: Aggregate transitions
        const grouped = {};
        for (const row of transitions) {
            const key = `${row.Material}|${row.PrevStatus}|${row.Plant}|${row.PlantSpecificMaterialStatus}`;
            grouped[key] = grouped[key] || {
                Material: row.Material,
                Description: row.Description,
                PrevStatus: row.PrevStatus,
                Plant: row.Plant,
                PlantSpecificMaterialStatus: row.PlantSpecificMaterialStatus,
                TransitionCount: 0,
                Direction: row.Direction
            };
            grouped[key].TransitionCount += row.TransitionCount;
        }

        const allGrouped = Object.values(grouped);
        if (allGrouped.length > 0) {
        }

        if (allGrouped.length === 0) {
            return res.status(200).json({ success: true, message: "No transitions to sync." });
        }

        // Step 4: Insert into DB
        let transactionStarted = false;
        let inserted = 0;

        try {
            await Predictions_DataDbInstance.run("BEGIN TRANSACTION");
            transactionStarted = true;

            for (const row of allGrouped) {
                await Predictions_DataDbInstance.run(`
                    INSERT INTO MaterialStatusTransitions (
                        Material, Description, PrevStatus, Plant, PlantSpecificMaterialStatus, TransitionCount, Direction
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(Material, PrevStatus, Plant, PlantSpecificMaterialStatus) DO UPDATE SET
                        TransitionCount = excluded.TransitionCount,
                        Direction = excluded.Direction
                `, [
                    row.Material,
                    row.Description,
                    row.PrevStatus,
                    row.Plant,
                    row.PlantSpecificMaterialStatus,
                    row.TransitionCount,
                    row.Direction
                ]);
                inserted++;
            }

            await Predictions_DataDbInstance.run("COMMIT");

            res.status(200).json({
                success: true,
                message: `MaterialStatusTransitions synced from MaterialData.`,
                inserted
            });

        } catch (innerErr) {
            if (transactionStarted) {
                await Predictions_DataDbInstance.run("ROLLBACK");
            }
            console.error("Error inserting MaterialStatusTransitions:", innerErr);
            res.status(500).json({ success: false, message: innerErr.message });
        }

    } catch (err) {
        console.error("Error syncing MaterialStatusTransitions:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
