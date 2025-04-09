import { processedDbInstance } from "../../Database/Database.js";

export const getViolations = async (req, res) => {
    try {
        const data = await processedDbInstance.all(
            'SELECT COUNT(*) AS total_violations FROM MaterialData WHERE ViolationReplacementPart = 1'
        );
        res.status(200).json({ success: true, data: data }); // Ensure data is always an array
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch PlanningPlant data',
            error: error.message
        });
    }
};