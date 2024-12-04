export interface QR {
  PK: string;
  SK: string;
  name: string;
  path: string;
  type?: QRType;
  qrDataUrl?: string;
}

export interface QRraw {
  id?: string;
  name: string;
  path: string;
  type?: QRType;
  qrDataUrl?: string;
}

export enum QRType {
  TABLE = "table",
  MENU = "menu",
  PORTAFOLIO = "portafolio",
  OTHER = "other",
}

export interface ErrorResponse {
  error: string;
}

export interface GetQrParams {
  TableName: string | undefined;
  Key: {
    PK: string;
    SK: string;
  };
}

export interface QueryQrParams {
  TableName: string | undefined;
  KeyConditionExpression: string;
  ExpressionAttributeValues: {
    ":pk": { S: string };
    ":sk": { S: string };
  };
}

export interface CreateQrParams {
  TableName: string | undefined;
  Item: QR;
}
