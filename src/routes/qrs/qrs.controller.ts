import { Request, Response } from "express";
import { dynamoDbClient, USERS_TABLE } from "../../config/dynamo";
import { QR, QRraw, QueryQrParams } from "./qrs.types";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { CustomRequest } from "@/middleware/auth.middleware";
import QRCode from "qrcode";
import { v4 as uuid } from "uuid";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";

const QRSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  type: z.enum(["table", "menu", "portafolio", "other"]),
});

export const getQrs = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("~ Starting getQrs by userId:", userId);

  const params: QueryQrParams = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": { S: `USER#${userId}` },
      ":sk": { S: "QR#" },
    },
  };

  try {
    console.debug("[*] getting Dynamo call with params: ", params);

    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    if (Items?.length) {
      console.debug("Items length: ", Items.length);

      const qrs = Items.map((item) => ({
        userId: item.PK?.S?.split("#")[1],
        name: item.name.S,
        type: item.type.S,
      }));

      res.json(qrs);
    } else {
      console.debug("No QRs found for provided to: ", userId);

      res.status(404).json({ error: "No QRs found for user" });
    }
  } catch (error) {
    console.error("[-] Error:", error);
    res.status(500).json({ error: "Error retrieving QRs" });
  }
};
export const createQr = async (req: CustomRequest, res: Response) => {
  console.info("~ Starting createQr by userId:", req.userId);
  const result = QRSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  const { name, path, type } = result.data;
  const userId = req.userId;
  const qrId = uuid();

  try {
    console.debug("[*] creating QR code for user: ", userId);
    const qrDataUrl = await QRCode.toDataURL(path, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
    });

    console.debug("[*] Adding QR code to DynamoDB");
    const qrParams = {
      TableName: USERS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `QR#${qrId}`,
        type,
        path,
        name,
        qrDataUrl,
        createdAt: new Date().toISOString(),
      },
    };

    await dynamoDbClient.send(new PutCommand(qrParams));
    res.json({ message: "QR code created", qrId, qrDataUrl });
  } catch (error) {
    console.error("[-] Error:", error);
    res.status(500).json({ error: "Error creating QR code" });
  }
};

const removeQrSchema = z.object({
  qrId: z.string().uuid(),
});

export const removeQr = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("~ Starting removeQr by userId:", userId);

  // Validate request
  const result = removeQrSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  // paramaters for getting qr from dynamo
  const qrId = req.params.qrId;
  const params = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `QR#${qrId}`,
    },
  };

  try {
    console.debug("[*] removing QR code from DynamoDB, userId: ", userId);

    // Try to remove it from dynamo
    const result = await dynamoDbClient.send(new DeleteCommand(params));
    if (!result.Attributes) {
      console.debug("[*] didn't find QR code of", userId);
      // If it didn't find it
      res.status(404).json({ error: "QR not found" });
      return;
    }
    console.debug(
      "[+] Successful remove QR code from DynamoDB, ",
      userId,
      ", qrId: ",
      qrId
    );

    res.status(200).json({ message: "QR removed" });
  } catch (error) {
    console.error("[-] Error:", error);
    res.status(500).json({ error: "Error removing QR code" });
  }

  res.json({ message: "remove" });
};

export const getQR = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("~ Starting getQR by userId:", userId);

  const qrId = req.params.qrId;
  const params = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `QR#${qrId}`,
    },
  };

  try {
    console.debug("[*] Retrieving QR code from DynamoDB, userId: ", userId);
    const result = await dynamoDbClient.send(new GetCommand(params));
    if (!result.Item) {
      console.debug("[*] didn't find QR code of", userId);
      // If it didn't find it
      res.status(404).json({ error: "QR not found" });
      return;
    }
    const qr = result.Item;
    console.debug(
      "[*] Successful get QR code from DynamoDB, ",
      userId,
      ", qrId: ",
      qrId
    );

    res.status(200).json(qr);
  } catch (error) {
    console.error("[-] Error:", error);
    res.status(500).json({ error: "Error getting QR code" });
  }
};
