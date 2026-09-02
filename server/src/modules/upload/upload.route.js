import express from "express";
import multer from "multer";
import authenticate from "../../middlewares/authenticate.js";
import { UploadController } from "./upload.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB limit
  },
});

const router = express.Router();

router.post(
  "/file",
  authenticate,
  upload.single("file"),
  UploadController.uploadFile
);

export default router;
