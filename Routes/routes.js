import express from "express";
import { upload, uploadCSV} from "../Controller/UploadController.js";
import express from 'express';
import {
    upload,
    uploadCSV,
    getUnprocessedData
} from '../Controller/UploadController.js';
import {
    getPredictionsData,
    uploadProcessedData, uploadPredictionsData, getPredictionsData, getProcessedData
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
router.post('/uploadProcessedData', uploadProcessedData);
router.post('/uploadPredictionsData', uploadPredictionsData);

// Common routes
router.get('/unprocessedData', getUnprocessedData);

router.get('/fetch_UnprocessedData', getUnprocessedData);
router.get('/fetch_ProcessedData', getProcessedData);
router.get('/fetch_PredictionsData', getPredictionsData);

export default router;
