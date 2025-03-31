import express from "express";
import { upload, uploadCSV , getUnprocessedData, UploadFaultReport} from "../Controller/UploadController.js";
import { uploadCleanedData, getPredictionData , getTechnicians , getLocations} from "../Controller/processed controller/DataController.js";
import multer from "multer";
const router = express.Router();

// Configure storage
const storage = multer.memoryStorage(); // Store as buffer in memory
const uploadpdf = multer({ storage: storage });

// In your routes file
router.post('/faultReport', uploadpdf.single('file'), UploadFaultReport);
// Initialize express router

router.get("/", (req, res) => {
    res.send("🚀 API Running!");
});


router.post("/uploadFile", upload.single('file'), uploadCSV);
router.get('/unprocessedData', getUnprocessedData);
router.post('/uploadData', uploadCleanedData);
router.get('/uploadPredictionData', getPredictionData);
router.get("/technicians", getTechnicians);
router.get("/locations", getLocations);


export default router;