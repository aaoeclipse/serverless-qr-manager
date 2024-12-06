import { authenticateToken } from "@/middleware/auth.middleware";
import { Router } from "express";
import {
  deleteDocument,
  getDocuments,
  getPresignedUrl,
  uploadDocument,
} from "./documents.controller";

const router = Router();

router.get("/", authenticateToken, getDocuments);
router.post("/", authenticateToken, getPresignedUrl);
router.get("/:documentId", authenticateToken, getDocuments);
router.post("/:documentId", authenticateToken, uploadDocument);
router.delete("/:documentId", authenticateToken, deleteDocument);

export default router;
