# Product Checkout Web

Frontend application for the Wompi onboarding test. It consumes the local backend from this monorepo, renders the current product, collects checkout data, tokenizes card details directly against Wompi Sandbox, creates a local transaction, and displays the final payment result.

## Overview

The application supports the following flow:

1. Fetch the current product from the backend
2. Navigate into checkout
3. Collect card, customer, and delivery data
4. Show a purchase summary before confirmation
5. Load checkout configuration from the backend
6. Tokenize the card against Wompi Sandbox
7. Create a pending transaction in the backend
8. Process the payment through the backend
9. Recover the final transaction state when needed

## Tech Stack

- React 19
- TypeScript
- Vite
- Redux Toolkit
- React Router
- Vitest + Testing Library

## Requirements

- Node.js 20+
- npm 10+
- The backend service running locally, usually at `http://localhost:3000`

## Environment Variables

Create a `.env` file based on [`.env.example`](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/.env.example).

```env
VITE_API_URL=http://localhost:3000
VITE_PAYMENT_PROVIDER_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
```

- `VITE_API_URL`: backend base URL
- `VITE_PAYMENT_PROVIDER_API_URL`: Wompi Sandbox base URL used for card tokenization

## Local Development

```bash
npm install
npm run dev
```

Vite will print the local URL, typically `http://localhost:5173`.

## Available Scripts

```bash
npm run dev
npm run test
npm run lint
npm run build
npm run preview
```

## Project Structure

- [src/app/router.tsx](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/app/router.tsx): application routes
- [src/store/store.ts](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/store/store.ts): Redux store setup
- [src/store/persistence.ts](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/store/persistence.ts): safe persistence and rehydration logic
- [src/features/catalog](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/features/catalog): current product state and API integration
- [src/features/checkout](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/features/checkout): visible checkout state, customer data, delivery data, pricing preview, legal flags
- [src/features/payment](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/features/payment): checkout config, transaction state, payment orchestration
- [src/pages/checkout-page.tsx](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/pages/checkout-page.tsx): main checkout flow
- [src/pages/checkout-result-page.tsx](C:/Users/Nicolas/Documents/projects/monorepos/product-paid-app/product-checkout-web/src/pages/checkout-result-page.tsx): final payment state and recovery by `transactionId`

## Backend Contracts

The frontend expects the backend to expose:

- `GET /products/current`
- `GET /checkout/config`
- `POST /transactions`
- `POST /transactions/:id/process-payment`
- `GET /transactions/:id`

## Security Notes

- Only non-sensitive data is persisted to `localStorage`
- Raw card number, CVC, and expiry are never persisted
- Card tokenization happens directly against Wompi Sandbox
- The backend never receives raw card details

## Testing

The current test suite covers:

- reducers
- persistence and rehydration
- form validation
- purchase summary rendering
- final result screen
- navigation guards for invalid recovered states

Run:

```bash
npm run test
```

## Known Limitation

The frontend is ready to drive the full payment flow, but a successful `APPROVED` end-to-end result still depends on fixing the integrity signature on the backend. With the current backend state, the flow may end in `ERROR` with the message `La firma es invalida`.
