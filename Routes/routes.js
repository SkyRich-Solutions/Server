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
<<<<<<< HEAD

// Fault Report imports
import {syncFaultReportsController,verifyTechnicianLinksController } from '../Controller/ProcessedController/SyncFaultReportsController.js';

//  Material imports
import { syncMaterialData } from '../Controller/ProcessedController/SyncMaterialDataController.js';
import { syncReplacementPredictionsController, syncMonteCarloDominanceController, syncReplacementTrendsController } from '../Controller/ProcessedController/SyncMaterialPredictionsController.js';

//  Turbine imports
import { syncTurbineData } from '../Controller/ProcessedController/SyncTurbineDataController.js';

//  Plant imports

import { syncPlantCoordinates } from '../Controller/ProcessedController/SyncPlantDataController.js';

// Upload Processed Data imports
import { uploadProcessedTurbineData, uploadProcessedMaterialData } from '../Controller/ProcessedController/UploadProcessedDataController.js';

// Upload Predictions Data imports
import { uploadTurbinePredictionsData, uploadMaterialPredictionsData } from '../Controller/ProcessedController/UploadPredictionsDataController.js';


=======
import { MaintPlant , PlanningPlant , MainAndPlanningPlant} from '../Controller/ProcessedController/MapsController.js';
>>>>>>> b17a5b717f4084e0562b170a384faf665caf6b5c
import { ScriptController } from '../Controller/Script/ScriptController.js';
import { getViolations } from '../Controller/ProcessedController/ViolationController.js';

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


// Common routes

router.get('/fetch_UnprocessedTurbineData', getUnprocessedTurbineData);
router.get('/fetch_UnprocessedMaterialData', getUnprocessedMaterialData);
router.get('/fetch_ProcessedMaterialData', getProcessedMaterialData);
router.get('/fetch_ProcessedTurbineData', getProcessedTurbineData);
router.get('/fetch_PredictionsData', getPredictionsData);

router.get('/technicians', getTechnicians);
router.get('/locations', getLocations);

// Map routes
router.get('/MaintPlant' , MaintPlant);
router.get('/PlanningPlant' , PlanningPlant);
router.get('/MainAndPlanningPlant' , MainAndPlanningPlant);


// Violation routes
 router.get('/violations', getViolations);

export default router;
