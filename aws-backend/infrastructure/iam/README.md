## IAM CloudFormation Templates

This folder contains AWS CloudFormation templates related to IAM resources for the project.

### iam-stack.yaml
- Creates an IAM user named `Groot`
- Creates an IAM group named `Avengers`
- Associates `Groot` to the `Avengers` group
- Adds a policy (`S3ListBucketsPolicy`) to allow listing all S3 buckets
- Includes tags for the user

## Notes
- The IAM group cannot have tags directly in CloudFormation.
- The policy currently allows `*` actions for demonstration purposes.
    - Follow the least Privilege Principle.
- You can extend the templates with additional users, groups, or policies as needed.