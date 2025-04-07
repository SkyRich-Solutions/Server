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
    uploadProcessedMaterialData,
    uploadProcessedTurbineData,
    uploadMaterialPredictionsData,
    uploadTurbinePredictionsData,
    getProcessedMaterialData,
    getProcessedTurbineData,
    syncPlantCoordinates,
    syncMaterialData,
    syncTurbineData,
    syncFaultReports,
    syncFaultReportsController,
    verifyTechnicianLinksController,
    getTechnicians,
    getLocations
} from '../Controller/ProcessedController/DataController.js';
import { MaintPlant , PlanningPlant , MainAndPlanningPlant} from '../Controller/ProcessedController/MapsController.js';
import { ScriptController } from '../Controller/Script/ScriptController.js';

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
router.post('/syncFaultReports', syncFaultReports);
router.post('/syncFaultReportsController', syncFaultReportsController);
router.post('/verifyTechnicianLinks', verifyTechnicianLinksController);

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

export default router;
