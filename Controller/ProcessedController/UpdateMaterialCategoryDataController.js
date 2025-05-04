import {processedDbInstance} from '../../Database/Database.js';

export const updateMaterialCategoryDataController = async (req, res) => {
    try {
        const db = processedDbInstance;
        const { selectedCategory, rows } = req.body;

        if (!selectedCategory || !Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ message: "Invalid request body. Must include selectedCategory and rows array." });
        }

        const stmt = await db.prepare(`
            UPDATE MaterialData 
            SET MaterialCategory = ?, Auto_Classified = 0
            WHERE Material = ? AND Plant = ?
        `);

        for (const { Material, Plant } of rows) {
            await stmt.run(selectedCategory, Material, Plant);
        }

        await stmt.finalize();

        res.status(200).json({ message: "Material categories updated successfully." });
    } catch (error) {
        console.error("DB update error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
