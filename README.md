# 🔲 QR Manager Serverless

A serverless backend solution for creating and managing QR codes linked to cloud-stored documents. Perfect for businesses and individuals who need to generate and manage QR codes for various use cases, such as restaurant menus, digital portfolios, and more.

## 🎯 Key Features

- QR Code Generation and Management
- Secure Document Storage
- User Authentication
- Scalable Serverless Architecture
- Pay-per-use Infrastructure
- Real-time Document Updates

## 🏗️ Architecture

### Tech Stack

- **Infrastructure as Code**: Serverless Framework
- **Cloud Provider**: AWS
  - Lambda Functions
  - API Gateway
  - S3 (Document Storage)
  - DynamoDB (Database)
  - Cognito (Authentication)
- **Backend Runtime**: Node.js with Express

## 🚀 Getting Started

### Prerequisites

- AWS Account
- Node.js (v18 or later)
- Serverless Framework CLI
- AWS CLI configured

### Installation

1. Clone the repository

```bash
git clone https://github.com/aaoeclipse/serverless-qr-manager
cd qr-manager-serverless
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

# Fill in your AWS credentials and other configuration

4. Deploy to AWS

```bash
serverless deploy
```
