import { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export const authenticateToken = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  try {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      throw new Error("Invalid token format");
    }

    // Create verifier for ID tokens
    const verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.USER_POOL_ID!,
      tokenUse: "id",
      clientId: process.env.CLIENT_ID!,
    });

    // Verify the token
    const payload = await verifier.verify(token);
    req.userId = payload.sub;

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(403).json({ error: "Invalid token" });
    return;
  }
};

export interface CustomRequest extends Request {
  userId?: string;
}
