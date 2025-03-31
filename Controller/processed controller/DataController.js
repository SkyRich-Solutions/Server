import { processedDbInstance, Predictions_DataDbInstance } from '../../Database/Database.js';

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

export const getPredictionData = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all('SELECT * FROM MaterialData');
        console.log('Prediction data(Material Data):', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching prediction data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch prediction data', error: error.message });
    }
}

export const getTechnicians = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all('SELECT Technician_ID, Name FROM Technician');
        console.log('Technician data:', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching technician data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch technician data', error: error.message });
    }
}

export const getLocations = async (req, res) => {
    try {
        const data = await Predictions_DataDbInstance.all('SELECT Location_ID, Location_Name FROM Location');
        console.log('Location data:', data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching location data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch location data', error: error.message });
    }
}

export const UploadFaultReport = async (req, res) => {
    try {
        const { Technician_ID, TurbineLocation, Report_Date, Fault_Description, Report_Status } = req.body;
        const fileBuffer = req.file ? req.file.buffer : null;

        if (!Technician_ID || !TurbineLocation || !Report_Date || !Fault_Description || !Report_Status) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const query = `
            INSERT INTO FaultReport (Technician_ID, TurbineLocation, Report_Date, Fault_Description, Report_Status, Updated_Time, Attachment)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
        `;

        const params = [Technician_ID, TurbineLocation, Report_Date, Fault_Description, Report_Status, fileBuffer];

        await Predictions_DataDbInstance.run(query, params);

        res.status(201).json({ success: true, message: "Fault report submitted successfully" });
    } catch (error) {
        console.error("Error submitting fault report:", error);
        res.status(500).json({ success: false, message: "Failed to submit fault report", error: error.message });
    }
};

