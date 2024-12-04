import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Specify return type
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  try {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      throw new Error("Invalid token");
    }

    const decoded = jwt.decode(token) as { sub: string };
    req.userId = decoded.sub;

    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }
};

export interface CustomRequest extends Request {
  userId?: string;
}
