import express from "express";
import { upload, uploadCSV , getUnprocessedData} from "../Controller/UploadController.js";
import { uploadCleanedData } from "../Controller/processed controller/DataController.js";

const router = express.Router();

// Initialize express router

router.get("/", (req, res) => {
    res.send("🚀 API Running!");
});


router.post("/uploadFile", upload.single('file'), uploadCSV);
router.get('/unprocessedData', getUnprocessedData);
router.post('/uploadData', uploadCleanedData);

export default router;