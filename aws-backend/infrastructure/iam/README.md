## IAM Stack: Roles & Policies for SmartLocker Lambdas

This stack provisions **IAM roles and managed policies** specifically for the SmartLocker demo project.  
It demonstrates the **principle of least privilege** by granting only the minimum permissions required for each Lambda function.

---

### 📄 Templates
- **iam-stack.yaml**  
  - Defines the `LockerDynamoDBReadWritePolicy` managed policy with DynamoDB access (UpdateItem only by default).  
  - Creates the `CreateLockerLambdaRole` role for the `CreateLocker` Lambda function.  
  - Attaches both AWS-managed (`AWSLambdaBasicExecutionRole`) and custom policies.  
  - Exports the role ARN for cross-stack references.

---

### ⚙️ Parameters
- **EnvironmentKey** (`dev | staging | production`)  
  Ensures unique resource names across multiple environments and avoids hardcoding.  

---

### 🛡️ Policies
- **LockerDynamoDBReadWritePolicy**  
  - Grants DynamoDB permissions scoped to the `LockersTable-{EnvironmentKey}` table.  
  - Currently includes `UpdateItem`.  
  - Additional actions (`PutItem`, `GetItem`, `DeleteItem`) can be enabled as needed.  

---

### 📤 Outputs
- **CreateLockerLambdaRoleArn**  
  - ARN of the IAM role created for the `CreateLocker` Lambda function.  
  - Exported for use in the Lambda stack.

---

📦 This stack is part of the **[AWS Serverless Portfolio](../../README.md)**.  
Check the main README for architecture diagrams, features, and project overview.
