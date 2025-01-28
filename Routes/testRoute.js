import express from 'express';
import { getJSON, postJSON } from '../Controller/UnprocessedController.js';
import { getProcessedJSON } from '../Controller/ProcessedController.js';

const router = express.Router();

router.get('/getJSON', getJSON);
router.post('/postJSON', postJSON);
router.get('/getProcessedJSON', getProcessedJSON);

export default router;
