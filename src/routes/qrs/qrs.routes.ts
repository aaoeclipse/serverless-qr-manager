import express from "express";
import { authenticateToken } from "../../middleware/auth.middleware";
import { getQrs, createQr, removeQr, getQR } from "./qrs.controller";

const router = express.Router();

router.get("/", authenticateToken, getQrs);
router.post("/doc/:docId", authenticateToken, createQr);
router.delete("/:qrId", authenticateToken, removeQr);
router.get("/:qrId", authenticateToken, getQR);
// TODO
// router.post("/:qrId", authenticateToken, addDocumentQr);

export default router;
