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
router.get("/:docId", authenticateToken, getDocuments);
// router.post("/:docId", authenticateToken, uploadDocument);
router.delete("/:docId", authenticateToken, deleteDocument);

export default router;
