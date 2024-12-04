import { Request, Response } from "express";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  MessageActionType,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({});

export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log(process.env);

  try {
    const createUserParams = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
      MessageAction: "SUPPRESS" as MessageActionType, // Type assertion here
    };

    await cognito.send(new AdminCreateUserCommand(createUserParams));

    const setPasswordParams = {
      Password: password,
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Permanent: true,
    };

    await cognito.send(new AdminSetUserPasswordCommand(setPasswordParams));

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: error });
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
