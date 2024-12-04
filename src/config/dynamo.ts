import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
export const dynamoDbClient = DynamoDBDocumentClient.from(client);

export const USERS_TABLE = process.env.USERS_TABLE;
