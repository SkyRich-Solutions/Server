import express from 'express';
import {
    upload,
    uploadCSV,
    getUnprocessedData
} from '../Controller/UploadController.js';
import {
    uploadCleanedData,
    getPredictionData
} from '../Controller/ProcessedController/DataController.js';
import { ScriptController } from '../Controller/Script/ScriptController.js';

const router = express.Router();

// Initialize express router

router.get('/', (req, res) => {
    res.send('🚀 API Running!');
});

// Front end routes
router.get('/uploadPredictionData', getPredictionData);
router.post('/uploadFile', upload.single('file'), uploadCSV);

// Backend routes
router.post('/uploadData', uploadCleanedData);
router.post('/run-python', ScriptController);

// Common routes
router.get('/unprocessedData', getUnprocessedData);

export default router;
