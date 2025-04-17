import {
    Predictions_DataDbInstance
} from '../../Database/Database.js';

import fs from 'fs/promises';

let geoMapping;
try {
    geoMapping = JSON.parse(
        await fs.readFile(
            new URL('../../utils/geo_mapping.json', import.meta.url)
        )
    );
} catch (err) {
    console.error(' Failed to load geo_mapping.json:', err);
    geoMapping = {};
}

export const syncPlantCoordinates = async (req, res) => {
    const { plants } = req.body;

    if (!Array.isArray(plants)) {
        return res
            .status(400)
            .json({ success: false, message: 'Invalid plant list' });
    }

    try {
        await Predictions_DataDbInstance.run('BEGIN TRANSACTION');

        for (const raw of plants) {
            const code = raw.code?.trim();
            const isPlant = !!raw.isPlant;
            const isPlanningPlant = !!raw.isPlanningPlant;
            const isManufacturingPlant = !!raw.isManufacturingPlant;

            if (!code) {
                console.warn(' Skipping plant entry due to missing code:', raw);
                continue;
            }

            const prefix = code.slice(0, 2);
            let coords = geoMapping[prefix];
            let defaulted = 0;

            if (!coords || coords.length < 2) {
                coords = [55.9429, 9.1257]; // Default to Brande
                defaulted = 1;
            }

            const [lat, lon] = coords;

            const existing = await Predictions_DataDbInstance.get(
                `SELECT IsPlant, IsPlanningPlant, IsManufacturingPlant FROM Plant WHERE Plant_Name = ?`,
                [code]
            );

            const finalIsPlant = isPlant || (existing?.IsPlant ?? 0);
            const finalIsPlanningPlant =
                isPlanningPlant || (existing?.IsPlanningPlant ?? 0);
            const finalIsManufacturingPlant =
                isManufacturingPlant || (existing?.IsManufacturingPlant ?? 0);

            const query = `
              INSERT INTO Plant (Plant_Name, Plant_Latitude, Plant_Longitude, Defaulted, IsPlant, IsPlanningPlant, IsManufacturingPlant)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(Plant_Name) DO UPDATE SET
                Plant_Latitude = excluded.Plant_Latitude,
                Plant_Longitude = excluded.Plant_Longitude,
                Defaulted = excluded.Defaulted,
                IsPlant = IsPlant OR excluded.IsPlant,
                IsPlanningPlant = IsPlanningPlant OR excluded.IsPlanningPlant,
                IsManufacturingPlant = IsManufacturingPlant OR excluded.IsManufacturingPlant
            `;

            const values = [
                code,
                lat,
                lon,
                defaulted,
                finalIsPlant ? 1 : 0,
                finalIsPlanningPlant ? 1 : 0,
                finalIsManufacturingPlant ? 1 : 0
            ];
            await Predictions_DataDbInstance.run(query, values);
        }

        await Predictions_DataDbInstance.run('COMMIT');

        res.status(200).json({
            success: true,
            message: ' Plant table updated with roles & coordinates'
        });
    } catch (error) {
        await Predictions_DataDbInstance.run('ROLLBACK');

        console.error(' Error syncing plant roles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync plant roles',
            error: error.message
        });
    }
};

export const syncPlantData = async (req, res) => {
    try {
        const query = ` SELECT * FROM Plant`;
        const data = await Predictions_DataDbInstance.all(query);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error syncing plant data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync plant data',
            error: error.message
        });
    }
};
