import { Request, Response } from "express";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbClient, USERS_TABLE } from "../../config/dynamo";
import { User, GetUserParams, CreateUserParams } from "./users.types";
import { CustomRequest } from "@/middleware/auth.middleware";
import { getUserProfile } from "@/adapter/DynamoAdapter";

// Modified functions
export const getUser = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "Not logged in" });
    return;
  }

  try {
    const user = await getUserProfile(userId);
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retrieve user" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { PK: userId, name } = req.body as Partial<User>;

  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
    return;
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
    return;
  }

  const params: CreateUserParams = {
    TableName: USERS_TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
      name,
      createdAt: new Date().toISOString(),
    },
  };
};
