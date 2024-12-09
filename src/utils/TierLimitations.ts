import {
  GetCommand,
  GetCommandInput,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDbClient, USERS_TABLE } from "../config/dynamo";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

/**
 * Checks if a user can create a new QR code based on their tier and the number of existing QR codes.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the user can create a new QR code.
 *
 * @throws {Error} - If there is an issue accessing DynamoDB.
 *
 * @example
 * const canCreate = await canCreateQR('user123');
 * console.log(canCreate); // true or false
 */
export const canCreateQR = async (userId: string) => {
  console.info("[🏁] Starting canCreateQR by userId:", userId);

  // Count number of QR for user and check if user tier is free
  // If user has pro tier then return
  const params: GetCommandInput = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
    },
    ProjectionExpression: "tier",
  };

  const userTier = await dynamoDbClient.send(new GetCommand(params));
  console.debug("[💡] User tier:", userTier, " for user: ", userId);

  // If user has free tier then check if user has less than 1 QRs
  if (userTier.Item?.tier === "pro") {
    return true;
  }

  // If user has less than 1 QRs then return true
  // If user has more than 1 QRs then return false
  const qrParams: QueryCommandInput = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "QR#",
    },
    Select: "COUNT",
  };

  const qrCountResult = await dynamoDbClient.send(new QueryCommand(qrParams));
  const qrCount = qrCountResult.Count || 0;
  console.debug("[💡] QR count:", qrCount, " for user: ", userId);

  if (qrCount >= 1) {
    return false;
  }

  return true;
};

/**
 * Checks if a user can create a new document based on their tier and the number of existing documents.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the user can create a new document.
 *
 * @throws {Error} - If there is an issue accessing DynamoDB.
 * @example
 * const canCreate = await canCreateDocument('user123');
 * console.log(canCreate); // true or false
 */
export const canCreateDocument = async (userId: string) => {
  console.info("[🏁] Starting canCreateDocument by userId:", userId);

  // Count number of Documents for user and check if user tier is free
  // If user has pro tier then return true
  const params: GetCommandInput = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
    },
    ProjectionExpression: "tier",
  };

  const userTier = await dynamoDbClient.send(new GetCommand(params));
  console.debug("[💡] User tier:", userTier, " for user: ", userId);

  // If user has free tier then check if user has less than 1 QRs
  if (userTier.Item?.tier === "pro") {
    return true;
  }

  // If user has less than 3 Documents then return true
  // If user has more than 3 Documents then return false
  const docParam: QueryCommandInput = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "DOC#",
    },
    Select: "COUNT",
  };

  const docCountResult = await dynamoDbClient.send(new QueryCommand(docParam));
  const docCount = docCountResult.Count || 0;
  console.debug("[💡] QR count:", docCount, " for user: ", userId);

  if (docCount >= 1) {
    return false;
  }

  return true;
};
