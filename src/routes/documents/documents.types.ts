export interface getQueryDocumentsParams {
  TableName: string | undefined;
  KeyConditionExpression: string;
  ExpressionAttributeValues: {
    ":pk": { S: string };
    ":sk": { S: string };
  };
}
