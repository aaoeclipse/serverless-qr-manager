import { Request, Response } from "express";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDbClient, USERS_TABLE } from "../../config/dynamo";
import { User, GetUserParams, CreateUserParams } from "./users.types";
import { CustomRequest } from "@/middleware/auth.middleware";

// Modified functions
export const getUser = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  const params: GetUserParams = {
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const user = Item as User;
      res.json({
        userId: user.PK.split("#")[1],
        name: user.name,
      });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
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
