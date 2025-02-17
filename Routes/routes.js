import express from "express";
import { upload, uploadCSV } from "../Controller/UploadController.js";

const router = express.Router();

// Initialize express router

router.get("/", (req, res) => {
    res.send("🚀 API Running!");
});


router.post("/uploadFile", upload.single('file'), uploadCSV);


export default router;