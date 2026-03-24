# AWS Infrastructure

This folder contains the Terraform configuration used to deploy the application to AWS with a minimal and low-cost setup.

## Deployed Architecture

- Frontend: Amazon S3 static website hosting
- Backend: Amazon EC2
- Database: Amazon RDS PostgreSQL
- IaC: Terraform
- Region: `us-east-1`

## What Terraform Manages

- VPC
- public subnet for EC2
- private subnets for RDS
- internet gateway
- public route table
- backend and database security groups
- EC2 instance for the backend
- RDS PostgreSQL instance
- S3 bucket for the frontend website
- useful outputs for URLs and resource IDs

## What Stayed Manual

- AWS account setup, MFA, IAM user, and billing alerts
- backend details on EC2
- runtime secrets in `.env`
- frontend build and upload to S3

## Current AWS URLs

- Frontend: [http://product-paid-app-nicolas-20260324-01.s3-website-us-east-1.amazonaws.com](http://product-paid-app-nicolas-20260324-01.s3-website-us-east-1.amazonaws.com)
- Backend: [http://ec2-35-175-216-28.compute-1.amazonaws.com:3000](http://ec2-35-175-216-28.compute-1.amazonaws.com:3000)
- Swagger: [http://ec2-35-175-216-28.compute-1.amazonaws.com:3000/docs](http://ec2-35-175-216-28.compute-1.amazonaws.com:3000/docs)

## Terraform Files

- [providers.tf](C:\Users\Nicolas\Documents\projects\monorepos\product-paid-app\infra\aws\providers.tf)
- [variables.tf](C:\Users\Nicolas\Documents\projects\monorepos\product-paid-app\infra\aws\variables.tf)
- [main.tf](C:\Users\Nicolas\Documents\projects\monorepos\product-paid-app\infra\aws\main.tf)
- [outputs.tf](C:\Users\Nicolas\Documents\projects\monorepos\product-paid-app\infra\aws\outputs.tf)
- [terraform.tfvars.example](C:\Users\Nicolas\Documents\projects\monorepos\product-paid-app\infra\aws\terraform.tfvars.example)

## Apply Strategy

The infrastructure was built in slices:

1. Terraform base
2. network baseline
3. RDS PostgreSQL
4. EC2 backend
5. S3 frontend hosting
6. runtime integration between frontend and backend

## Frontend Deployment

The frontend is intentionally deployed outside Terraform object management. The bucket exists in Terraform, but the site contents are uploaded manually after building:

```powershell
cd C:\Users\Nicolas\Documents\projects\monorepos\product-paid-app\product-checkout-web
$env:VITE_API_URL="http://ec2-35-175-216-28.compute-1.amazonaws.com:3000"
$env:VITE_PAYMENT_PROVIDER_API_URL="https://api-sandbox.co.uat.wompi.dev/v1"
npm run build
aws s3 sync .\dist\ s3://product-paid-app-nicolas-20260324-01 --delete
```

## Backend Runtime Notes

- the backend runs on EC2 with `systemd`
- the backend listens on port `3000`
- the backend uses the RDS endpoint through `DATABASE_URL`
- `FRONTEND_URL` must match the S3 website URL for CORS

## Known Limitation

The deployed flow reaches the sandbox payment provider, but with the current credentials the final result may still end in `ERROR` because of the integrity signature. This is an application/provider configuration issue, not an AWS infrastructure issue.
