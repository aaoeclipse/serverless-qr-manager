import { CustomRequest } from "@/middleware/auth.middleware";
import { getQueryDocumentsParams } from "./documents.types";
import { dynamoDbClient, USERS_TABLE } from "@/config/dynamo";
import { v4 as uuid } from "uuid";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { Response } from "express";

export const getDocuments = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  console.info("~ Starting getDocuments by userId:", userId);

  const docId = uuid();

  const params: getQueryDocumentsParams = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": { S: `USER#${userId}` },
      ":sk": { S: `DOCUMENT#${docId}` },
    },
  };

  try {
    const { Items } = await dynamoDbClient.send(new QueryCommand(params));
    if (Items?.length) {
      const documents = Items.map((item) => ({
        userId: item.PK?.S?.split("#")[1],
        name: item.name.S,
        type: item.type.S,
      }));
      res.json(documents);
    }
  } catch (error) {
    console.error("[-] Error:", error);
    res.status(500).json({ error: "Error retrieving documents" });
  }
};
