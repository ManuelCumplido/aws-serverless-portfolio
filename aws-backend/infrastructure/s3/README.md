## S3 CloudFormation Templates

This folder contains AWS CloudFormation templates related to S3 resources for the project.

### s3-stack.yaml

- Creates an S3 bucket for the AWS backend project
- Bucket name is dynamic and includes the AWS region for uniqueness
- Versioning is defined but suspended to avoid extra costs
- Encrypts all objects with AES256 by default (no additional cost)
- Blocks all public access to follow AWS security best practices
- Outputs:
    - Final name of the S3 bucket
    - ARN of the S3 bucket (useful for IAM policies or cross-stack references)

## Notes

- Versioning is currently Suspended; enable only if object history is required.
- The bucket is fully private — public access is blocked.
- Encryption is enforced automatically; no need to define it at the object level.
- Use the Outputs (MyBucketName and BucketArn) to reference this bucket in other stacks.
- Apply the least privilege principle when assigning IAM permissions for this bucket.