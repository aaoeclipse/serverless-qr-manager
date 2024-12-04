export interface User {
  PK: string;
  SK: string;
  name: string;
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
}

export interface GetUserParams {
  TableName: string | undefined;
  Key: {
    PK: string;
    SK: string;
  };
}
export interface CreateUserParams {
  TableName: string | undefined;
  Item: User;
}
