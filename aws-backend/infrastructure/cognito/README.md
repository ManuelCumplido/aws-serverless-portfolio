## Cognito Stack: User Pool, Client, Domain & Groups for SmartLockers

This stack provisions **Amazon Cognito resources** for the SmartLockers demo project.  
It enables secure user authentication and authorization via a hosted user pool, app client, domain, and role-based groups.

---

### 📄 Templates
- **cognito-lockers-stack.yaml**  
  - Creates the **SmartLockersUserPool** for managing authentication.  
  - Defines the **SmartLockersUserPoolClient** for frontend/mobile applications.  
  - Configures a **Cognito Hosted UI Domain** (`smartlockers-auth`) for login/logout.  
  - Creates **User Groups**: `admins` and `users` for role-based access control.  
  - Exports IDs and domain for integration with other stacks (e.g., Lambdas, API Gateway).  

---

### ⚙️ Authentication Features
- **User Pool**  
  - Email auto-verification enabled.  
  - Password policy: minimum length = 8, requires uppercase, lowercase, numbers.  
- **App Client**  
  - Supports multiple auth flows: `USER_PASSWORD_AUTH`, `REFRESH_TOKEN_AUTH`, `SRP_AUTH`.  
  - Callback/logout URLs for local frontend development and OIDC debugging.  
- **Hosted UI Domain**  
  - Provides a ready-to-use login/logout interface via Cognito.  

---

### 👥 User Groups
- **Admins Group**  
  - Group: `admins`  
  - Description: Administradores de SmartLockers  
  - Precedence: 1 (highest priority)  

- **Users Group**  
  - Group: `users`  
  - Description: Usuarios finales de SmartLockers  
  - Precedence: 2  

---

### 📤 Outputs
- **UserPoolId** – Cognito User Pool ID for cross-stack references.  
- **UserPoolClientId** – Cognito App Client ID for integration with applications.  
- **CognitoDomain** – Hosted UI domain for testing and login flows.  

---

### ⚠️ Notes
- Hosted UI domain (`smartlockers-auth`) must be unique per AWS region.  
- Callback/logout URLs are set for **localhost** and [OIDC Debugger](https://oidcdebugger.com/debug); replace with production URLs when deploying.  
- Groups enable **role-based access control**; extend with more groups as needed.  

---

📦 This stack is part of the **[AWS Serverless Portfolio](../../../README.md)**. 
Check the main README for architecture diagrams, features, and project overview.
