import { Response } from "express";
import { dynamoDbClient, USERS_TABLE } from "../../config/dynamo";
import { QRraw, QRType } from "./qrs.types";
import { CustomRequest } from "@/middleware/auth.middleware";
import QRCode from "qrcode";
import { v4 as uuid } from "uuid";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import {
  createUserQR,
  QueryUsersQr,
  removeUserQR,
} from "@/adapter/DynamoAdapter";
import { canCreateQR } from "@/utils/TierLimitations";

const QRSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  type: z.enum(["table", "menu", "portafolio", "other"]),
});

export const getQrs = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting getQrs by userId:", userId);

  if (!userId) {
    res.status(400).json({ error: "Not logged in" });
    return;
  }

  try {
    console.debug("[🐛] getting Dynamo call with for userId: ", userId);
    const userQrs = await QueryUsersQr(userId);
    if (userQrs.length > 0) {
      res.json(userQrs);
    } else {
      console.debug("No QRs found for provided to: ", userId);
      res.status(404).json({ error: "No QRs found for user" });
    }
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error retrieving QRs" });
  }
};

export const createQr = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting createQr by userId:", userId);

  // Validate request
  const result = QRSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  // Parse request
  const { name, path, type } = result.data;
  const qrId = uuid();

  const qR: QRraw = {
    id: qrId,
    name,
    path,
    type: type as QRType,
    qrDataUrl: "",
  };

  if (!userId) {
    res.status(400).json({ error: "Not logged in" });
    return;
  }

  // Check Tier of user
  if (!canCreateQR(userId)) {
    res.status(400).json({
      error: "User has reached the maximum number of QR codes allowed",
    });
    return;
  }

  try {
    console.debug("[🐛] creating QR code for user: ", userId);

    const qrDataUrl = await QRCode.toDataURL(path, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
    });

    qR.qrDataUrl = qrDataUrl;

    console.debug("[🐛] Adding QR code to DynamoDB");
    const qrCreated = createUserQR(userId, qR);

    console.debug("[✅] QR code created: ", qrCreated);
    res.json({ message: "QR code created", qrId, qrDataUrl });
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error creating QR code" });
  }
};

const removeQrSchema = z.object({
  qrId: z.string().uuid(),
});

export const removeQr = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting removeQr by userId:", userId);

  if (!userId) {
    res.status(400).json({ error: "Not logged in" });
    return;
  }

  // Validate request
  const result = removeQrSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  // paramaters for getting qr from dynamo
  const qrId = req.params.qrId;

  try {
    console.debug("[🐛] removing QR code from DynamoDB, userId: ", userId);

    // Try to remove it from dynamo
    const result = await removeUserQR(userId, qrId);
    if (!result) {
      console.debug("[🐛] didn't find QR code of", userId);
      res.status(404).json({ error: "QR not found" });
      return;
    }

    console.debug(
      "[✅] Successful remove QR code from DynamoDB, ",
      userId,
      ", qrId: ",
      qrId
    );

    res.status(200).json({ message: "QR removed" });
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error removing QR code" });
  }

  res.json({ message: "remove" });
};

export const getQR = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting getQR by userId:", userId);

  const qrId = req.params.qrId;
  const params = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `QR#${qrId}`,
    },
  };

  try {
    console.debug("[🐛] Retrieving QR code from DynamoDB, userId: ", userId);
    const result = await dynamoDbClient.send(new GetCommand(params));
    if (!result.Item) {
      console.debug("[🐛] didn't find QR code of", userId);
      // If it didn't find it
      res.status(404).json({ error: "QR not found" });
      return;
    }
    const qr = result.Item;
    console.debug(
      "[🐛] Successful get QR code from DynamoDB, ",
      userId,
      ", qrId: ",
      qrId
    );

    res.status(200).json(qr);
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error getting QR code" });
  }
};
