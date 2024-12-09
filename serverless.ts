// serverless.ts
import type { AWS } from "@serverless/typescript";

const serverlessConfig: AWS = {
  org: "aaoeclipse",
  app: "qr-manager-restaurant",
  service: "serverless-qr-manager",
  plugins: ["serverless-offline"],
  frameworkVersion: "4",

  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    environment: {
      USERS_TABLE: "${self:custom.tableName}",
      USER_POOL_ID: { Ref: "UserPool" },
      CLIENT_ID: { Ref: "UserClient" },
      S3_BUCKET: { Ref: "S3Bucket" },
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
        Resource: [{ "Fn::GetAtt": ["UsersTable", "Arn"] }, "*"],
      },
    ],
  },

  custom: {
    tableName: "qr-manager-dynamodb-${sls:stage}",
  },

  functions: {
    api: {
      handler: "index.handler",
      events: [
        {
          http: {
            path: "users/{userId}",
            method: "get",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "users",
            method: "post",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "auth/signup",
            method: "post",
            cors: true,
          },
        },
        {
          http: {
            path: "auth/login",
            method: "post",
            cors: true,
          },
        },
        {
          http: {
            path: "qr",
            method: "get",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "qr",
            method: "post",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "qr/{qrId}",
            method: "get",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "qr/{qrId}",
            method: "delete",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "documents",
            method: "get",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "documents",
            method: "post",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "documents/{documentId}",
            method: "post",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "documents/{documentId}",
            method: "get",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
        {
          http: {
            path: "documents/{documentId}",
            method: "delete",
            cors: true,
            authorizer: {
              name: "PrivateAuthorizer",
              type: "COGNITO_USER_POOLS",
              arn: {
                "Fn::GetAtt": ["UserPool", "Arn"],
              },
              claims: ["email"],
            },
          },
        },
      ],
    },
  },

  resources: {
    Resources: {
      UserPool: {
        Type: "AWS::Cognito::UserPool",
        Properties: {
          UserPoolName: "${self:service}-user-pool-${sls:stage}",
          Schema: [
            {
              Name: "email",
              Required: true,
              Mutable: true,
            },
          ],
          Policies: {
            PasswordPolicy: {
              MinimumLength: 6,
              RequireLowercase: true,
              RequireNumbers: true,
              RequireSymbols: true,
              RequireUppercase: true,
            },
          },
          AutoVerifiedAttributes: ["email"],
        },
      },
      UserClient: {
        Type: "AWS::Cognito::UserPoolClient",
        Properties: {
          ClientName: "${self:service}-user-pool-client-${sls:stage}",
          GenerateSecret: false,
          UserPoolId: { Ref: "UserPool" },
          AccessTokenValidity: 5,
          IdTokenValidity: 5,
          ExplicitAuthFlows: ["ADMIN_NO_SRP_AUTH"],
        },
      },
      UsersTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "PK",
              AttributeType: "S",
            },
            {
              AttributeName: "SK",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "PK",
              KeyType: "HASH",
            },
            {
              AttributeName: "SK",
              KeyType: "RANGE",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:custom.tableName}",
        },
      },
      S3Bucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "qr-manager-s3-${sls:stage}",
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
                AllowedOrigins: ["*"],
                Id: "CORSRuleId1",
                MaxAge: 3600,
              },
            ],
          },
        },
      },
    },
  },
};

export default serverlessConfig;
