import express from "express";
import {
    upload,
    uploadCSV,
    getUnprocessedData, 
    getUnprocessedMaterialData, 
    getUnprocessedTurbineData
} from '../Controller/UploadController.js';
import {
    getPredictionsData,
    uploadProcessedMaterialData, uploadProcessedTurbineData, 
    uploadMaterialPredictionsData, uploadTurbinePredictionsData, 
    getProcessedMaterialData, getProcessedTurbineData, syncPlantCoordinates
} from '../Controller/ProcessedController/DataController.js';
import { ScriptController } from '../Controller/Script/ScriptController.js';

const router = express.Router();

// Initialize express router

router.get('/', (req, res) => {
    res.send('🚀 API Running!');
});


// Front end routes
router.get('/uploadPredictionData', getPredictionsData);
router.post('/uploadFile', upload.single('file'), uploadCSV);
router.post('/run-python', ScriptController);

// Backend routes
router.post('/uploadProcessedTurbineData', uploadProcessedTurbineData);
router.post('/uploadProcessedMaterialData', uploadProcessedMaterialData);
router.post('/uploadMaterialPredictionsData', uploadMaterialPredictionsData);
router.post('/uploadTurbinePredictionsData', uploadTurbinePredictionsData);
router.post('/syncPlantCoordinates', syncPlantCoordinates);

// Common routes
router.get('/unprocessedData', getUnprocessedData);

router.get('/fetch_UnprocessedTurbineData', getUnprocessedTurbineData);
router.get('/fetch_UnprocessedMaterialData', getUnprocessedMaterialData);
router.get('/fetch_ProcessedMaterialData', getProcessedMaterialData);
router.get('/fetch_ProcessedTurbineData', getProcessedTurbineData);
router.get('/fetch_PredictionsData', getPredictionsData);

export default router;

getUnprocessedTurbineData