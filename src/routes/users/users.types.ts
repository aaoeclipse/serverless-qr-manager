export interface User {
  PK: string;
  SK: string;
  name: string;
  createdAt: string;
}

export interface UserRaw {
  id: string;
  email: string;
  createdAt: string;
  name?: string;
  directory: string;
  tier: TierType;
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export enum TierType {
  FREE = "free",
  PRO = "pro",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  PAST_DUE = "past_due",
  NAN = "nan",
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
