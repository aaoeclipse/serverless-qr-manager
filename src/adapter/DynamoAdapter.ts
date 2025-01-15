import {
  DeleteCommand,
  DeleteCommandInput,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandOutput,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDbClient, USERS_TABLE } from "../config/dynamo";
import { Get, QueryCommand } from "@aws-sdk/client-dynamodb";
import { QRraw, QRType } from "@/routes/qrs/qrs.types";
import { Document } from "@/routes/documents/documents.types";
import { UserRaw } from "@/routes/users/users.types";

/**
 * Queries QR codes associated with a specific user
 * @param {string} userid - The unique identifier of the user
 * @returns {Promise<QRraw[]>} Array of QR code objects containing id, name, path, type, and data URL
 */
export const QueryUsersQr = async (userid: string): Promise<QRraw[]> => {
  const params: QueryCommandInput = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": { S: `USER#${userid}` },
      ":sk": { S: "QR#" },
    },
  };

  const result = await dynamoDbClient.send(new QueryCommand(params));

  const qrs: QRraw[] =
    result.Items?.map((item) => {
      return {
        id: item.SK.S?.split("#")[1],
        name: item.name.S,
        path: item.path.S,
        type: (item.type?.S as QRType) || QRType.OTHER,
        qrDataUrl: item.qrDataUrl?.S || "",
      } as QRraw;
    }) || [];

  return qrs;
};

/**
 * Retrieves all documents associated with a specific user
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<Document[]>} Array of document objects containing docId, name, url, timestamps, and status
 */
export const QueryUsersDoc = async (userId: string): Promise<Document[]> => {
  const params: QueryCommandInput = {
    TableName: USERS_TABLE,
    KeyConditionExpression: "PK = :pk AND SK = :sk",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "DOCUMENTS#",
    },
  };

  const result = await dynamoDbClient.send(new QueryCommand(params));

  const docs: Document[] =
    result.Items?.map((item) => {
      return {
        docId: item.SK.S?.split("#")[1],
        name: item.name.S,
        url: item.url.S,
        createdAt: item.createdAt.S,
        ownerId: item.ownerId.S,
        uploading: item.uploading.BOOL,
      } as Document;
    }) || [];

  return docs;
};

/**
 * Retrieves user information
 * @param {string} userId - The unique identifier of the user
 * @returns {Promise<UserRaw>} Returns user if successful
 */
export const getUserProfile = async (userId: string): Promise<UserRaw> => {
  const params: GetCommandInput = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
    },
  };

  const result = await dynamoDbClient.send(new GetCommand(params));

  // check if result return empty
  if (!result.Item) {
    throw new Error("User not found");
  }

  const user: UserRaw = {
    id: result.Item.PK.S?.split("#")[1],
    email: result.Item.email.S,
    name: result.Item.name?.S,
    createdAt: result.Item.createdAt?.S,
    tier: result.Item.tier?.S,
    directory: result.Item.directory?.S,
    subscriptionId: result.Item.subscriptionId?.S,
    subscriptionStatus: result.Item.subscriptionStatus?.S,
    subscriptionStartDate: result.Item.subscriptionStartDate?.S,
    subscriptionEndDate: result.Item.subscriptionEndDate?.S,
  };

  return user;
};

/**
 * Creates a new QR code entry for a specific user and saves it on dynamo
 * @param {string} userId - The unique identifier of the user
 * @param {QRraw} qrInfo - Object containing QR code information (id, type, path, name, data URL)
 * @returns {Promise<PutCommandOutput>} DynamoDB PutCommand response
 */
export const createUserQR = async (
  userId: string,
  qrInfo: QRraw
): Promise<PutCommandOutput> => {
  const qrParams = {
    TableName: USERS_TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `QR#${qrInfo.id}`,
      type: qrInfo.type,
      path: qrInfo.path,
      name: qrInfo.name,
      qrDataUrl: qrInfo.qrDataUrl,
      createdAt: new Date().toISOString(),
    },
  };

  return await dynamoDbClient.send(new PutCommand(qrParams));
};

/**
 * Removes a QR code entry for a specific user
 *
 * @param userId
 * @param qrId
 * @returns {Promise<boolean>}
 */
export const removeUserQR = async (
  userId: string,
  qrId: string
): Promise<boolean> => {
  const params: DeleteCommandInput = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `QR#${qrId}`,
    },
  };

  const result = await dynamoDbClient.send(new DeleteCommand(params));

  // return boolean if success
  if (!result.Attributes) {
    return false;
  }
  return true;
};

/**
 * Retrieves a specific document associated with a user from the database.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} docId - The unique identifier of the document.
 * @returns {Promise<Document>} A promise that resolves to the document object containing docId, name, url, createdAt, ownerId, and uploading status.
 *
 * @throws {Error} If the document is not found in the database.
 */

export const GetDocumentOfUserById = async (
  userId: string,
  docId: string
): Promise<Document> => {
  console.debug("[🐛] GetDocumentOfUserById", userId, docId);
  const params: GetCommandInput = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `DOCUMENT#${docId}`,
    },
  };

  const result = await dynamoDbClient.send(new GetCommand(params));

  // check if result return empty
  if (!result.Item) {
    throw new Error("Document not found");
  }

  const document: Document = {
    docId: result.Item.SK.split("#")[1],
    name: result.Item.name,
    url: result.Item.url,
    createdAt: result.Item.createdAt,
    ownerId: result.Item.ownerId,
    uploading: result.Item.uploading,
  };

  console.debug("[🐛] GetDocumentOfUserById ~ Document: ", document);

  return document;
};
