import { Request, Response } from "express";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  MessageActionType,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import { dynamoDbClient, s3Client } from "@/config";
import {
  CreateBucketCommand,
  CreateBucketCommandInput,
} from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

const cognito = new CognitoIdentityProviderClient({});

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const createUserParams = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
      MessageAction: "SUPPRESS" as MessageActionType,
    };

    const cognitoResponse = await cognito.send(
      new AdminCreateUserCommand(createUserParams)
    );

    const userId = cognitoResponse.User?.Attributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    if (!userId) {
      throw new Error("Failed to get user ID from Cognito");
    }

    const setPasswordParams = {
      Password: password,
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Permanent: true,
    };

    await cognito.send(new AdminSetUserPasswordCommand(setPasswordParams));

    const dynamoParams = {
      TableName: process.env.USERS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `PROFILE#${userId}`,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        directory: `${userId}`,
        // Subscription related fields
        tier: "free", // 'free' or 'pro'
        subscriptionId: null, // Payment provider subscription ID
        subscriptionStatus: "active", // 'active', 'cancelled', 'past_due'
        subscriptionStartDate: null,
        subscriptionEndDate: null,
      },
    };

    await dynamoDbClient.send(new PutCommand(dynamoParams));

    res.status(200).json({
      message: "User registered successfully",
      userId,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const params = {
      AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH, // Use the enum
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    const response = await cognito.send(new AdminInitiateAuthCommand(params));

    res.json({
      message: "Login successful",
      token: response.AuthenticationResult?.IdToken,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(401).json({ error: "Invalid credentials" });
  }
};
