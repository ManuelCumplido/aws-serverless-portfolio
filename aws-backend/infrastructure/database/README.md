## DynamoDB Stack: LockersTable for SmartLocker Project

This stack provisions a **DynamoDB table** for the SmartLocker demo project.  
It demonstrates best practices such as scalability, resilience, and cost-efficiency while staying within AWS Free Tier for demo purposes.

---

### 📄 Templates
- **dynamodb-lockers-stack.yaml**  
  - Defines the `LockersTable` with partition key `lockerId`.  
  - Adds a Global Secondary Index (GSI) on `ownerId`.  
  - Enables **Point-in-Time Recovery (PITR)** for continuous backups.  
  - Enables **deletion protection** to prevent accidental data loss.  
  - Configures **auto-scaling** for read/write capacity at table and index level.  
  - Exports the table name and ARN for cross-stack references.  

---

### ⚙️ Parameters
- **EnvironmentKey** (`dev | staging | production`)  
  Ensures dynamic naming for tables across environments and avoids hardcoding.  

---

### 📊 Resources
- **LockersTable** – Primary DynamoDB table with partition key `lockerId`.  
- **ownerId-index (GSI)** – Global Secondary Index to query lockers by owner.  
- **Auto Scaling Targets & Policies** – Adjusts read/write capacity for both the table and the GSI based on utilization (target 80%).  

---

### 📤 Outputs
- **LockersTableName** – Exported physical name of the table for Lambda environment variables.  
- **LockersTableArn** – Exported ARN for IAM policies to enforce least-privilege access.  

---

### ⚠️ Notes
- Auto-scaling configured with min=1 and max=5 RCUs/WCUs for demo purposes.  
- PITR and deletion protection are enabled by default to safeguard data.  

---

📦 This stack is part of the **[AWS Serverless Portfolio](../../../README.md)**.
Check the main README for architecture diagrams, features, and project overview.
