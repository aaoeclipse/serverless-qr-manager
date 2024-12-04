import express from "express";
import { authenticateToken } from "../../middleware/auth.middleware";
import { getUser, createUser } from "./users.controller";

const router = express.Router();

router.get("/:userId", authenticateToken, getUser);
router.post("/", authenticateToken, createUser);

export default router;
