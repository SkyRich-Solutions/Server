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
    getTechnicians
} from '../Controller/ProcessedController/DataController.js';
// Fault Report imports
import {
    syncFaultReportsController,
    verifyTechnicianLinksController
} from '../Controller/ProcessedController/SyncFaultReportsController.js';

//  Material imports
import { syncMaterialData } from '../Controller/ProcessedController/SyncMaterialDataController.js';
import {
    syncReplacementPredictionsController,
    syncMonteCarloDominanceController,
    syncReplacementTrendsController
} from '../Controller/ProcessedController/SyncMaterialPredictionsController.js';

//  Turbine imports
import { syncTurbineData } from '../Controller/ProcessedController/SyncTurbineDataController.js';

//  Plant imports

import {
    syncPlantCoordinates,
    syncPlantData
} from '../Controller/ProcessedController/SyncPlantDataController.js';

// Upload Processed Data imports
import {
    uploadProcessedTurbineData,
    uploadProcessedMaterialData,
    fetchReplacementParts,
    fetchPlantTable,
    fetchMaterialTable
} from '../Controller/ProcessedController/UploadProcessedDataController.js';

// Upload Predictions Data imports
import { uploadTurbinePredictionsData, uploadMaterialPredictionsData, fetchReplacementPrediction } from '../Controller/ProcessedController/UploadPredictionsDataController.js';


// Upload Catecory Predictions Data imports
import { syncMaterialCategoryPredictionsController } from '../Controller/ProcessedController/SyncMaterialCategoryPredictions.js';

// Upload Plant Specific Material Status Transitions imports
import { syncPlantSpecificMaterialStatusTransitions } from '../Controller/ProcessedController/SyncPlantSpecificMaterialStatusTransitions.js';

//Upload Material Category Health Score imports
import { syncMaterialCategoryHealthScores } from '../Controller/ProcessedController/SyncMaterialCategoryHealthScores.js';

//Uplodad Material Maintenance Forecasts imports
import { syncMaterialMaintenanceForecasts } from '../Controller/ProcessedController/SyncMaterialMaintenanceForecasts.js';


// Upload Material Component Health Score imports
import { syncMaterialComponentHealthScores } from '../Controller/ProcessedController/SyncMaterialComponentHealthScores.js';

//Upload Turbine Model Health Score imports
import { syncTurbineModelHealthScores } from '../Controller/ProcessedController/SyncTurbineModelHealthScores.js';

//Upload Turbine Platform Health Score imports
import { syncTurbinePlatformHealthScores } from '../Controller/ProcessedController/SyncTurbinePlatformHealthScores.js';

import { ScriptController } from '../Controller/Script/ScriptController.js';

import {
    WarehousePlanningPlant,
    WarehouseManufacturingPlant,
    WarehousePlant,
    getAllTurbine
} from '../Controller/ProcessedController/MapsController.js';

import {
    getMaterialReplacementPartsViolations,
    getMaterialClassified,
    getMaterialCompliantReplacementParts,
    getMaterialKnownPlant,
    getMaterialUnclassified,
    getMaterialUnknownPlant,
    getTurbineKnownMaintPlant,
    getTurbineUnknownMaintPlantViolation,
    getTurbineKnownPlanningPlant,
    getTurbineUnknownPlanningPlantViolation,
    getTurbineUnknownLocation,
    getTurbineKnownLocation
} from '../Controller/ProcessedController/ViolationController.js';


const router = express.Router();

import multer from 'multer';
import { getAllFaultReports } from '../Controller/ProcessedController/FaultReportController.js';
import { getMaterialReplacementParts } from '../Controller/ProcessedController/ReplacementPartsController.js';
import { getReplacementPrediction, getReplacementPredictionGlobal } from '../Controller/ProcessedController/ReplacementPartsController.js';
import { getMaterialReplacementPartsTrends } from '../Controller/ProcessedController/ReplacementPartsController.js';
import { getMaterialCategoryHealthScores } from '../Controller/ProcessedController/MaterialCategoryController.js';
import { getMaterialCategoryPredictions } from '../Controller/ProcessedController/MaterialCategoryController.js';
import { getMaterialComponentHealthScore } from '../Controller/ProcessedController/MaterialComponentController.js';
import { getMaterialComponentScoreSummary } from '../Controller/ProcessedController/MaterialComponentController.js';
import { getMaterialCategoryScoreSummary } from '../Controller/ProcessedController/MaterialCategoryController.js';
import { getTurbineModelHealthScore } from '../Controller/ProcessedController/TurbineModelController.js';
import { getTurbineModelScoreSummary } from '../Controller/ProcessedController/TurbineModelController.js';
import { getTurbinePlatformHealthScore } from '../Controller/ProcessedController/TurbinePlatformController.js';
import { getTurbinePlatformScoreSummary } from '../Controller/ProcessedController/TurbinePlatformController.js';


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
router.post(
    '/syncReplacementPredictions',
    syncReplacementPredictionsController
);
router.post('/syncMonteCarloDominance', syncMonteCarloDominanceController);
router.post('/syncReplacementTrends', syncReplacementTrendsController);
router.post('/syncMaterialCategoryPredictions', syncMaterialCategoryPredictionsController);
router.post("/syncPlantSpecificMaterialStatusTransitions", syncPlantSpecificMaterialStatusTransitions);
router.post("/syncMaterialCategoryHealthScores", syncMaterialCategoryHealthScores);
router.post("/syncMaterialMaintenanceForecasts", syncMaterialMaintenanceForecasts);
router.post('/syncMaterialComponentHealthScores', syncMaterialComponentHealthScores);
router.post('/syncTurbineModelHealthScores', syncTurbineModelHealthScores);
router.post("/syncTurbinePlatformHealthScores", syncTurbinePlatformHealthScores);

// Common routes

router.get('/fetch_UnprocessedTurbineData', getUnprocessedTurbineData);
router.get('/fetch_UnprocessedMaterialData', getUnprocessedMaterialData);
router.get('/fetch_ProcessedMaterialData', getProcessedMaterialData);
router.get('/fetch_ProcessedTurbineData', getProcessedTurbineData);
router.get('/fetch_PredictionsData', getPredictionsData);
router.get('/fetchReplacementParts', fetchReplacementParts);
router.get("/fetchPlantTable", fetchPlantTable);
router.get("/fetchMaterialTable", fetchMaterialTable);
router.get("/fetchReplacementPrediction", fetchReplacementPrediction);

router.get('/technicians', getTechnicians);

// Map routes
router.get('/getAllTurbine', getAllTurbine);
router.get('/getPlantData', syncPlantData);
router.get('/getWarehousePlanningPlant', WarehousePlanningPlant);
router.get('/getWarehouseManufacturingPlant', WarehouseManufacturingPlant);
router.get('/getWarehosuePlant', WarehousePlant);

// Violation routes
// Material
router.get(
    '/getMaterialReplacementPartsViolations',
    getMaterialReplacementPartsViolations
);
//
router.get(
    '/getMaterialCompliantReplacementParts',
    getMaterialCompliantReplacementParts
);
//
router.get('/getMaterialUnclassified', getMaterialUnclassified);
//
router.get('/getMaterialClassified', getMaterialClassified);
//
router.get('/getMaterialUnknownPlant', getMaterialUnknownPlant);
//
router.get('/getMaterialKnownPlant', getMaterialKnownPlant);
//
//Turbine
router.get(
    '/getTurbineUnknownPlanningPlantViolation',
    getTurbineUnknownPlanningPlantViolation
);
//
router.get(
    '/getTurbineUnknownMaintPlantViolation',
    getTurbineUnknownMaintPlantViolation
);
//
router.get('/getTurbineKnownMaintPlant', getTurbineKnownMaintPlant);

router.get('/getTurbineKnownPlanningPlant', getTurbineKnownPlanningPlant);
router.get('/getTurbineUnknownLocation', getTurbineUnknownLocation);
router.get('/getTurbineKnownLocation', getTurbineKnownLocation);

//FaultReport
router.get('/getAllFaultReports', getAllFaultReports);
router.get('/getMaterialCategoryHealthScores', getMaterialCategoryHealthScores);
router.get('/getMaterialCategoryPredictions', getMaterialCategoryPredictions);
router.get('/getMaterialCategoryScoreSummary', getMaterialCategoryScoreSummary);
router.get('/getMaterialComponentHealthScore', getMaterialComponentHealthScore);
router.get('/getMaterialComponentScoreSummary', getMaterialComponentScoreSummary);
router.get('/getReplacementPart', getMaterialReplacementParts);
router.get('/getReplacementPrediction', getReplacementPrediction);
router.get('/getReplacementPredictionGlobal', getReplacementPredictionGlobal);
router.get('/getReplacementTrends', getMaterialReplacementPartsTrends);
router.get('/getTurbineModelHealthScore', getTurbineModelHealthScore);
router.get('/getTurbineModelScoreSummary', getTurbineModelScoreSummary);
router.get('/getTurbinePlatformHealthScore', getTurbinePlatformHealthScore);
router.get('/getTurbinePlatformScoreSummary', getTurbinePlatformScoreSummary);


export default router;
