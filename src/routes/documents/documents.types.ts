export interface Document {
  docId: string;
  name: string;
  url: string;
  createdAt: string;
  ownerId: string;
  uploading: boolean;
}

export interface DocumentDynamodb {
  PK: { S: string };
  SK: { S: string };
  name: { S: string };
  url: { S: string };
  createdAt: { S: string };
  ownerId: { S: string };
  uploading: { BOOL: boolean };
}

export interface getQueryDocumentsParams {
  TableName: string | undefined;
  KeyConditionExpression: string;
  ExpressionAttributeValues: {
    ":pk": { S: string };
    ":sk": { S: string };
  };
}

export interface createDocumentParams {
  TableName: string | undefined;
  Item: DocumentDynamodb;
}
