import express from "express";
import { getJson } from "../Controller/UploadController.js";

const router = express.Router();

// Initialize express router

router.get("/", (req, res) => {
    res.send("🚀 API Running!");
});

router.get("/upload", getJson)


export default router;