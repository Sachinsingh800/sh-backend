import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../middleware/admin-auth.js";
import {
  uploadAuthentication,
  uploadBuffer,
} from "../services/imagekit.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024, files: 1 },
});

export const mediaRouter = Router();

mediaRouter.get("/imagekit-auth", requireAdmin, (req, res) => {
  res.json({ data: uploadAuthentication() });
});

mediaRouter.post(
  "/upload",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "A multipart file field is required." });
    }
    const result = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.body.folder || "/story-hub",
    );
    res.status(201).json({ data: result });
  },
);
