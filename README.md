# Product Checkout App

## Overview
This repository contains a full-stack checkout application for a single in-stock product.

The app implements a 5-step purchase flow:
1. Product page
2. Card and delivery information
3. Payment summary
4. Final transaction status
5. Return to product page with updated stock

The system persists checkout progress across refresh, creates a local `PENDING` transaction before charging, processes the payment through a sandbox payment provider, and updates stock only when the transaction is approved.

## Stack

### Frontend
- React
- Vite
- TypeScript
- Redux Toolkit
- React Router
- Vitest + Testing Library

### Backend
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Swagger
- Jest

### Infrastructure
- AWS S3 for the frontend static site
- AWS EC2 for the backend API
- AWS RDS PostgreSQL for the database
- Terraform for core infrastructure provisioning

## Live URLs
- Frontend: [http://product-paid-app-nicolas-20260324-01.s3-website-us-east-1.amazonaws.com](http://product-paid-app-nicolas-20260324-01.s3-website-us-east-1.amazonaws.com)
- Backend API: [http://ec2-35-175-216-28.compute-1.amazonaws.com:3000](http://ec2-35-175-216-28.compute-1.amazonaws.com:3000)
- Swagger: [http://ec2-35-175-216-28.compute-1.amazonaws.com:3000/docs](http://ec2-35-175-216-28.compute-1.amazonaws.com:3000/docs)

## Business Flow
1. The frontend loads the current product from the backend.
2. The customer enters card, customer, and delivery data.
3. The frontend shows a summary preview.
4. The frontend requests checkout configuration from the backend.
5. The frontend tokenizes the card directly against the sandbox payment provider.
6. The backend creates a local `PENDING` transaction.
7. The backend processes the payment against the sandbox provider.
8. The backend updates the local transaction result.
9. The backend decreases stock only for approved payments.
10. The frontend restores or displays the final transaction status when needed.

## Repository Structure
- [product-checkout-web](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web): React SPA
- [product-checkout-api](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-api): NestJS API
- [infra/aws](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/infra/aws): Terraform files and AWS deployment notes
- [sequence-flow.puml](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/sequence-flow.puml): sequence diagram for the checkout flow

## Data Model
Core entities:
- `Product`
- `Customer`
- `Delivery`
- `Transaction`

Transaction states:
- `PENDING`
- `APPROVED`
- `DECLINED`
- `ERROR`

The backend database is seeded with a single active product for the checkout flow.

## Main API Endpoints
- `GET /products/current`
- `GET /checkout/config`
- `POST /transactions`
- `POST /transactions/:id/process-payment`
- `GET /transactions/:id`

## Local Setup

### Backend
See [product-checkout-api/README.md](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-api/README.md).

Main backend environment variables:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/product_checkout
PAYMENT_PROVIDER_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
PAYMENT_PROVIDER_PUBLIC_KEY=pub_stagtest_replace_me
PAYMENT_PROVIDER_PRIVATE_KEY=prv_stagtest_replace_me
PAYMENT_PROVIDER_INTEGRITY_KEY=stagtest_integrity_replace_me
BASE_FEE_CENTS=0
DELIVERY_FEE_CENTS=0
```

### Frontend
See [product-checkout-web/README.md](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/README.md).

Main frontend environment variables:

```env
VITE_API_URL=http://localhost:3000
VITE_PAYMENT_PROVIDER_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

## Testing

### Backend
Run:

```bash
cd product-checkout-api
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:cov -- --runInBand
```

Current backend coverage from the generated report:
- Statements: `100%`
- Functions: `100%`
- Branches: `94.44%`
- Lines: `100%`

### Frontend
Run:

```bash
cd product-checkout-web
npm test
npm run build
npm run lint
```

Current frontend automated suite:
- `8` test files passing
- `22` tests passing

## AWS Deployment Notes
The deployed AWS setup uses:
- S3 static website hosting for the frontend
- EC2 for the backend runtime
- RDS PostgreSQL for the database
- Terraform for the main infrastructure resources

More details are documented in [infra/aws/README.md](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/infra/aws/README.md).

## Security Notes
- Raw card number, CVC, and expiry are never persisted in frontend state or local storage.
- The backend never stores raw card data.
- Pricing and stock are controlled by the backend.
- Approved transaction persistence and stock decrement are handled atomically in the backend.

## Tradeoffs
- The AWS deployment is intentionally minimal to keep infrastructure understandable and low-cost.
- The frontend static site is hosted directly on S3 without CloudFront in the first iteration.
- Some runtime deployment steps remain operational rather than fully automated.
