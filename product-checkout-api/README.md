# Product Checkout API

Backend for the technical checkout challenge built with `NestJS + TypeScript + Prisma + PostgreSQL`, integrated with a sandbox payment provider environment.

## What it does

- exposes the current checkout product
- returns the public payment configuration required by the frontend
- creates local `PENDING` transactions
- processes card payments against the sandbox provider
- persists the final transaction state
- decreases stock only for `APPROVED` payments
- restores the final state after refresh with `GET /transactions/:id`

## Architecture

The API is organized by modules and layers:

- `src/catalog`
  - current product and catalog access
- `src/checkout`
  - transaction creation, status lookup, and flow orchestration
- `src/payments`
  - payment provider integration and payment configuration
- `src/shared`
  - shared infrastructure, including Prisma

The backend is split into:

- `controllers`
- `application/use-cases`
- `application/ports`
- `domain`
- `infrastructure`

## Minimal model

- `Product`
- `Customer`
- `Delivery`
- `Transaction`

Local transaction states:

- `PENDING`
- `APPROVED`
- `DECLINED`
- `ERROR`

## Environment variables

Define these variables in `.env`:

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

For this technical challenge, the sandbox/UAT keys come from the PDF delivered with the exercise.

## Installation

```bash
npm install
npm run prisma:generate
```

## Database

Create and seed the local database:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

The seed leaves a single active product ready for the checkout.

## Running the backend

Development mode:

```bash
npm run start:dev
```

Local production mode:

```bash
npm run build
npm run start:prod
```

## Swagger

API documentation is available at:

- [http://localhost:3000/docs](http://localhost:3000/docs)

## Main endpoints

- `GET /products/current`
- `GET /checkout/config`
- `POST /transactions`
- `POST /transactions/:id/process-payment`
- `GET /transactions/:id`

## Manual test flow

1. `GET /checkout/config`
2. `POST /transactions`
3. tokenize a card with `POST {PAYMENT_PROVIDER_API_URL}/tokens/cards`
4. `POST /transactions/:id/process-payment`
5. `GET /transactions/:id`

Useful sandbox cards:

- `4242 4242 4242 4242` for an approved scenario
- `4111 1111 1111 1111` for a declined scenario

## Tests

Unit tests:

```bash
npm test -- --runInBand
```

E2E tests:

```bash
npm run test:e2e -- --runInBand
```

Business-focused coverage:

```bash
npm run test:cov -- --runInBand
```

Current useful coverage:

- `100%` statements/lines/functions across use cases and application mappers
- `94%+` branch coverage in business logic

## Notes

- sensitive card data is never stored, and pricing is always calculated by the backend
- a transaction outside `PENDING` is never reprocessed
- the payment flow reaches the sandbox provider, but the current UAT credentials reject the integrity signature, so failed attempts are persisted as `ERROR`
