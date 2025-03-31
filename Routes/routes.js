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
    uploadProcessedMaterialData, uploadProcessedTurbineData, uploadPredictionsData, getProcessedData
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
router.post('/uploadPredictionsData', uploadPredictionsData);

// Common routes

router.get('/fetch_UnprocessedTurbineData', getUnprocessedTurbineData);
router.get('/fetch_UnprocessedMaterialData', getUnprocessedMaterialData);
router.get('/fetch_ProcessedData', getProcessedData);
router.get('/fetch_PredictionsData', getPredictionsData);

export default router;

getUnprocessedTurbineData