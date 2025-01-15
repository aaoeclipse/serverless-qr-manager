import { CustomRequest } from "@/middleware/auth.middleware";
import {
  createDocumentParams,
  getQueryDocumentsParams,
} from "./documents.types";
import { s3Client, S3_BUCKET } from "@/config/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { dynamoDbClient, USERS_TABLE } from "@/config/dynamo";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DeleteCommandInput,
  PutCommand,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { Response } from "express";
import { z } from "zod";

const uploadDocumentSchema = z.object({
  name: z.string().min(1),
});

const validateDocumentUpload = z.object({
  docId: z.string().uuid(),
});

export const getDocuments = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting getDocuments by userId:", userId);

  const params: getQueryDocumentsParams = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": { S: `USER#${userId}` },
      ":sk": { S: "DOCUMENT#" },
    },
  };

  try {
    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    if (Items?.length) {
      const documents = Items.map((item) => ({
        docId: item.SK?.S?.split("#")[1],
        userId: item.PK?.S?.split("#")[1],
        name: item.name?.S || "",
        url: item.url?.S || "",
        createdAt: item.createdAt?.S || "",
        uploading: item.uploading?.BOOL || true,
      }));
      res.json(documents);
    }
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error retrieving documents" });
  }
};

export const getPresignedUrl = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting getPresignedUrl by userId:", userId);

  const result = uploadDocumentSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  const { name } = result.data;
  const docId = uuid();
  const s3Key = `${userId}/${docId}`;

  try {
    // Create initial DynamoDB record
    const params: createDocumentParams = {
      TableName: USERS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `DOCUMENT#${docId}`,
        name: name,
        createdAt: new Date().toISOString(),
        ownerId: userId ?? "",
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`,
        uploading: true,
      },
    };

    await dynamoDbClient.send(new PutCommand(params));

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.status(200).json({ docId, presignedUrl, s3Key });
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error generating presigned URL" });
  }
};

export const uploadDocument = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting uploadDocument by userId:", userId);

  const result = validateDocumentUpload.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  const { docId } = result.data;
  // update dynamo to uploading true
  try {
    const params: UpdateCommandInput = {
      TableName: USERS_TABLE,
      Key: {
        PK: { S: `USER#${userId}` },
        SK: { S: `DOCUMENT#${docId}` },
      },
      UpdateExpression: "SET uploading = :uploading",
      ExpressionAttributeValues: {
        ":uploading": false,
      },
    };

    await dynamoDbClient.send(new UpdateCommand(params));
    res.json({ success: true });
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error updating document status" });
  }
};

export const deleteDocument = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("[🏁] Starting deleteDocument by userId:", userId);

  const result = validateDocumentUpload.safeParse({ docId: req.params.docId });
  if (!result.success) {
    res.status(400).json({ error: result.error.issues });
    return;
  }

  const { docId } = result.data;

  console.info("[DEBUG] docId:", docId);

  try {
    const params: DeleteCommandInput = {
      TableName: USERS_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: `DOCUMENT#${docId}`,
      },
    };
    console.info("[DEBUG] params:", params);

    await dynamoDbClient.send(new DeleteCommand(params));
    res.json({ success: true });
  } catch (error) {
    console.error("[❌] Error:", error);
    res.status(500).json({ error: "Error deleting document" });
  }
};
