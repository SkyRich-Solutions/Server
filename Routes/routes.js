import express from 'express';
import {
    upload,
    uploadCSV,
    getUnprocessedMaterialData,
    getUnprocessedTurbineData,
    UploadFaultReport
} from '../Controller/UploadController.js';
import {
    getPredictionsData,
    getProcessedMaterialData,
    getProcessedTurbineData,
    getTechnicians,
    getLocations
} from '../Controller/ProcessedController/DataController.js';
// Fault Report imports
import {syncFaultReportsController,verifyTechnicianLinksController } from '../Controller/ProcessedController/SyncFaultReportsController.js';

//  Material imports
import { syncMaterialData } from '../Controller/ProcessedController/SyncMaterialDataController.js';
import { syncReplacementPredictionsController, syncMonteCarloDominanceController, syncReplacementTrendsController } from '../Controller/ProcessedController/SyncMaterialPredictionsController.js';

//  Turbine imports
import { syncTurbineData } from '../Controller/ProcessedController/SyncTurbineDataController.js';

//  Plant imports

import { syncPlantCoordinates, syncPlantData } from '../Controller/ProcessedController/SyncPlantDataController.js';

// Upload Processed Data imports
import { uploadProcessedTurbineData, uploadProcessedMaterialData, fetchReplacementParts, fetchPlantTable, fetchMaterialTable } from '../Controller/ProcessedController/UploadProcessedDataController.js';

// Upload Predictions Data imports
import { uploadTurbinePredictionsData, uploadMaterialPredictionsData } from '../Controller/ProcessedController/UploadPredictionsDataController.js';

// Upload Catecory Predictions Data imports
import { syncMaterialCategoryPredictionsController } from '../Controller/ProcessedController/SyncMaterialCategoryPredictions.js';

// Upload Plant Specific Material Status Transitions imports
import { syncPlantSpecificMaterialStatusTransitions } from '../Controller/ProcessedController/SyncPlantSpecificMaterialStatusTransitions.js';

//Upload Material Category Health Score imports
import { syncMaterialCategoryHealthScores } from '../Controller/ProcessedController/SyncMaterialCategoryHealthScores.js';

//Uplodad Material Maintenance Forecasts imports
import { syncMaterialMaintenanceForecasts } from '../Controller/ProcessedController/SyncMaterialMaintenanceForecasts.js';


import { ScriptController } from '../Controller/Script/ScriptController.js';
import { getTurbineViolation, getViolations, getViolations0 , getTurbineViolation0, getMaterialClassified, getMaterialUnclassified, getMaterialUnknownPlant, getMaterialKnownPlant } from '../Controller/ProcessedController/ViolationController.js';
import { MaintPlant , PlanningPlant , MainAndPlanningPlant, WarehousePlanningPlant, WarehouseManufacturingPlant, WarehousePlant} from '../Controller/ProcessedController/MapsController.js';

const router = express.Router();

import multer from 'multer';

const storage = multer.memoryStorage(); // Store as buffer in memory
const uploadpdf = multer({ storage: storage });
// Initialize express router

router.get('/', (req, res) => {
    res.send('🚀 API Running!');
});

// Front end routes
router.get('/uploadPredictionData', getPredictionsData);
router.post('/uploadFile', upload.single('file'), uploadCSV);
router.post('/faultReport', uploadpdf.single('file'), UploadFaultReport);
router.post('/run-python', ScriptController);

// Backend routes
router.post('/uploadProcessedTurbineData', uploadProcessedTurbineData);
router.post('/uploadProcessedMaterialData', uploadProcessedMaterialData);
router.post('/uploadMaterialPredictionsData', uploadMaterialPredictionsData);
router.post('/uploadTurbinePredictionsData', uploadTurbinePredictionsData);
router.post('/syncPlantCoordinates', syncPlantCoordinates);
router.post('/syncMaterialData', syncMaterialData);
router.post('/syncTurbineData', syncTurbineData);
router.post('/syncFaultReportsController', syncFaultReportsController);
router.post('/verifyTechnicianLinks', verifyTechnicianLinksController);
router.post("/syncReplacementPredictions", syncReplacementPredictionsController);
router.post('/syncMonteCarloDominance', syncMonteCarloDominanceController);
router.post('/syncReplacementTrends', syncReplacementTrendsController);
router.post('/syncMaterialCategoryPredictions', syncMaterialCategoryPredictionsController);
router.post("/syncPlantSpecificMaterialStatusTransitions", syncPlantSpecificMaterialStatusTransitions);
router.post("/syncMaterialCategoryHealthScores", syncMaterialCategoryHealthScores);
router.post("/syncMaterialMaintenanceForecasts", syncMaterialMaintenanceForecasts);

// Common routes

router.get('/fetch_UnprocessedTurbineData', getUnprocessedTurbineData);
router.get('/fetch_UnprocessedMaterialData', getUnprocessedMaterialData);
router.get('/fetch_ProcessedMaterialData', getProcessedMaterialData);
router.get('/fetch_ProcessedTurbineData', getProcessedTurbineData);
router.get('/fetch_PredictionsData', getPredictionsData);
router.get('/fetchReplacementParts', fetchReplacementParts);
router.get("/fetchPlantTable", fetchPlantTable);
router.get("/fetchMaterialTable", fetchMaterialTable);

router.get('/technicians', getTechnicians);
router.get('/locations', getLocations);

// Map routes
router.get('/MaintPlant' , MaintPlant);
router.get('/PlanningPlant' , PlanningPlant);
router.get('/MainAndPlanningPlant', MainAndPlanningPlant);
router.get('/getPlantData', syncPlantData);
router.get('/getWarehousePlanningPlant', WarehousePlanningPlant);
router.get('/getWarehouseManufacturingPlant', WarehouseManufacturingPlant);
router.get('/getWarehosuePlant', WarehousePlant);

// Violation routes
 router.get('/violations', getViolations);
 router.get('/getViolation0' , getViolations0);
 router.get('/getTurbineViolation', getTurbineViolation);
 router.get('/getTurbineViolation0', getTurbineViolation0);   
 router.get('/getMaterialClassifiedPlant', getMaterialClassified);
 router.get('/getMaterialUnclassifiedPlant', getMaterialUnclassified);
 router.get('/getMaterialUnknownPlant',getMaterialUnknownPlant);
 router.get('/getMaterialKnownPlant', getMaterialKnownPlant);

export default router;
