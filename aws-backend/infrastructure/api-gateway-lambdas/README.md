## API Gateway Stack: SmartLocker REST API

This stack provisions an **Amazon API Gateway** and integrates it with a Lambda function for the SmartLocker demo project.  
It also configures **Cognito authentication**, CloudWatch logging, and exports resources for cross-stack usage.

---

### 📄 Templates
- **api-lambdas-stack.yaml**  
  - Creates the **SmartLockerApiGateway** with OpenAPI 3.0.3 definition.  
  - Configures stage, tracing (AWS X-Ray), and environment variables.  
  - Integrates the `POST /lockers` route with the `CreateLockerLambda`.  
  - Enables **Cognito Authorizer** to secure API requests.  
  - Defines IAM role and policy for CloudWatch logging.  
  - Creates explicit log group for Lambda with 14-day retention.  

---

### ⚙️ Parameters
- **EnvironmentKey** (`dev | staging | production`)  
  Dynamically names resources per environment.  
- **SmartLockersUserPool**  
  Cognito User Pool ID imported from the Cognito stack for authentication.  

---

### 🔗 Resources
- **SmartLockerApiGateway** – REST API with OpenAPI 3.0.3 spec.  
- **CognitoAuthorizer** – Secures endpoints using Cognito User Pool.  
- **CreateLockerLambda** – Lambda function handling `POST /lockers`.  
- **ApiGwExecutionRole** – IAM role allowing API Gateway to publish logs.  
- **ApiGatewayAccount** – Binds execution role for CloudWatch logging.  
- **CreateLockerLambdaLogGroup** – Explicit log group with retention policy.  

---

### 🔒 Security & Observability
- **Cognito Authorizer** enforces JWT-based authentication on `/lockers`.  
- **CloudWatch Logs** configured with least-privilege IAM role.  
- **AWS X-Ray tracing** enabled for monitoring requests.  

---

### 📤 Outputs
- Exports API ID, stage, and authorizer references (for integration with other stacks).  
- Lambda uses imported resources:  
  - **CreateLockerLambdaRoleArn** (from IAM stack).  
  - **LockersTableName** (from DynamoDB stack).  

---

### ⚠️ Notes
- The policy attached to `ApiGwExecutionRole` currently uses `"*"` actions for demo purposes. Replace with least-privilege policies in production.  
- Callback URLs in the Cognito stack must match your frontend for successful authentication.  
- Log retention is set to 14 days to reduce costs. Adjust based on compliance needs.  

---

📦 This stack is part of the **[AWS Serverless Portfolio](../../../README.md)**. 
Check the main README for architecture diagrams, features, and project overview.
