import express from 'express';
import { DynamicFileUpload } from '../Controller/UploadController.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/DynamicFileUpload', upload.single('file'), DynamicFileUpload);

export default router;
