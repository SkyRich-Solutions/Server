import {
    unprocessedDbInstance,
    processedDbInstance,
    Predictions_DataDbInstance
} from '../../Database/Database.js';


export const syncFaultReportsController = async (req, res) => {
    try {
        await syncFaultReports(Predictions_DataDbInstance);
        res.status(200).json({ success: true, message: ' FaultReports synced from ReplacementParts' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const syncFaultReports = async (Predictions_DataDbInstance) => {
    const dbs = [
        { name: 'PredictionsDb', instance: Predictions_DataDbInstance }
    ];

    for (const { name, instance: db } of dbs) {
        try {
            await db.run('BEGIN TRANSACTION');

            // Fetch available technician IDs
            const technicians = await db.all(`SELECT Technician_ID FROM Technician`);
            const techIDs = technicians.map(t => t.Technician_ID);
            if (techIDs.length === 0) {
                throw new Error(`No technicians found in ${name} database`);
            }

            const materialsWithB = await db.all(`
                SELECT md.Material, md.Plant, md.ReplacementPart, m.Material_ID
                FROM MaterialData md
                JOIN Material m ON m.Material_A9B_Number = md.Material
                WHERE md.ReplacementPart = 'B'
            `);

            for (const row of materialsWithB) {
                if (!row.Material_ID) continue;

                const turbines = await db.all(`
                    SELECT FunctionalLoc FROM TurbineData
                    WHERE MaintPlant = ?
                `, [row.Plant]);

                if (turbines.length === 0) continue;

                for (const turbine of turbines) {
                    await db.run(
                        `INSERT OR IGNORE INTO Location (Location_Name) VALUES (?)`,
                        [turbine.FunctionalLoc]
                    );

                    const location = await db.get(`
                        SELECT Location_ID FROM Location
                        WHERE Location_Name = ?
                    `, [turbine.FunctionalLoc]);

                    if (!location) continue;

                    const exists = await db.get(`
                        SELECT 1 FROM FaultReport
                        WHERE TurbineLocation = ? AND Material_ID = ? AND Fault_Type = 'Replacement Part'
                    `, [location.Location_ID, row.Material_ID]);

                    if (!exists) {
                        const randomTechID = techIDs[Math.floor(Math.random() * techIDs.length)];

                        await db.run(`
                            INSERT INTO FaultReport (
                                Technician_ID,
                                TurbineLocation,
                                Report_Date,
                                Fault_Type,
                                Material_ID,
                                Report_Status,
                                Updated_Time,
                                Attachment
                            ) VALUES (
                                ?, ?, DATE('now'), 'Replacement Part', ?, 'Open', CURRENT_TIMESTAMP, NULL
                            )
                        `, [randomTechID, location.Location_ID, row.Material_ID]);
                    }
                }
            }

            await db.run('COMMIT');
        } catch (error) {
            await db.run('ROLLBACK');
            console.error(` Error syncing fault reports in ${name}:`, error.message);
            throw error;
        }
    }
};

export const verifyTechnicianLinksController = async (req, res) => {
    try {
        const data = await verifyTechnicianLinks(Predictions_DataDbInstance);
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to verify links", error: err.message });
    }
};

export const verifyTechnicianLinks = async (db) => {
    try {
        const results = await db.all(`
            SELECT
                fr.Report_ID,
                fr.Technician_ID,
                t.Name,
                t.Surname
            FROM FaultReport fr
            LEFT JOIN Technician t ON fr.Technician_ID = t.Technician_ID
            ORDER BY fr.Report_ID
        `);

        if (results.length === 0) {
            console.log(" No FaultReports found.");
        } else {
            console.table(results.map(r => ({
                Report_ID: r.Report_ID,
                Technician_ID: r.Technician_ID,
                Name: r.Name || 'NULL',
                Surname: r.Surname || 'NULL'
            })));
        }

        return results;
    } catch (error) {
        console.error(" Error verifying technician links:", error.message);
        throw error;
    }
};
