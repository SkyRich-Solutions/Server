import { processedDbInstance } from '../../Database/Database.js';

/**
 * POST Method: Receives cleaned data from Python and persists it into the processed database.
 */
export const uploadCleanedData = async (req, res) => {
    try {
        const cleanedData = req.body;

        if (!Array.isArray(cleanedData) || cleanedData.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        await processedDbInstance.run('BEGIN TRANSACTION');

        for (const record of cleanedData) {
            await processedDbInstance.run(
                `INSERT OR REPLACE INTO TurbineData 
                (FunctionalLoc, Description, MaintPlant, PlanningPlant, Platform, WTShortName, TurbineModel, MkVersion, 
                Revision, NominalPower, OriginalEqManufact, SBOMForTurbine, SCADAName, SCADAParkID, SCADACode, 
                SCADAFunctionalLoc, TechID, Region, Technology, HubHeight, TowerHeight, TurbineClass, 
                TurbineLatitude, TurbineLongitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    record.FunctionalLoc, record.Description, record.MaintPlant, record.PlanningPlant, record.Platform,
                    record.WTShortName, record.TurbineModel, record.MkVersion, record.Revision, record.NominalPower,
                    record.OriginalEqManufact, record.SBOMForTurbine, record.SCADAName, record.SCADAParkID, 
                    record.SCADACode, record.SCADAFunctionalLoc, record.TechID, record.Region, record.Technology, 
                    record.HubHeight, record.TowerHeight, record.TurbineClass, record.TurbineLatitude, record.TurbineLongitude
                ]
            );
        }

        await processedDbInstance.run('COMMIT');

        res.status(201).json({ success: true, message: 'Cleaned data successfully persisted' });
    } catch (error) {
        await processedDbInstance.run('ROLLBACK');
        console.error('Error saving cleaned data:', error);
        res.status(500).json({ success: false, message: 'Failed to save cleaned data', error: error.message });
    }
};
