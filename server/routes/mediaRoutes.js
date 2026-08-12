import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router
  .route("/upload-video")
  .post(isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded.",
        });
      }

      const result = await uploadMedia(req.file.path);

      res.status(200).json({
        success: true,
        message: "File uploaded successfully.",
        data: result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error uploading file",
      });
    }
  });
export default router;
