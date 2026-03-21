# Product Checkout App

## Overview
This project is a full-stack product checkout application focused on a simple purchase flow for a single in-stock product.

The goal is to build a mobile-first checkout experience where a customer can:
- view a product and its available stock
- enter card and delivery information
- review a payment summary
- complete a sandbox payment flow
- see the final transaction result
- return to the product page with updated stock

The system is designed to cover both the user-facing checkout experience and the backend transaction orchestration behind it.

## Project Goals
- Build a responsive single page application for the checkout flow
- Expose a backend API for products, transactions, customers, and deliveries
- Persist transaction state so progress can be recovered after refresh
- Process payments through a sandbox environment
- Update stock only when a payment is approved
- Provide test coverage for both frontend and backend
- Prepare the app for deployment

## Planned Stack

### Frontend
- React
- Vite
- TypeScript
- Redux Toolkit
- React Router
- Mobile-first responsive UI

### Backend
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Swagger
- Jest

## Core Business Flow
1. Display the current product with description, price, and available stock.
2. Let the customer start checkout and enter card and delivery details.
3. Show a payment summary including product amount and fixed fees.
4. Create a local pending transaction before processing the payment.
5. Process the payment through a sandbox provider.
6. Update the local transaction with the final result.
7. Decrease stock only if the payment is approved.
8. Show the final transaction status and return to the product page.

## Backend Responsibilities
- Serve the current product and stock
- Create pending transactions
- Store customer and delivery data
- Process payment requests through a sandbox gateway
- Persist final transaction status
- Protect business rules around stock and transaction states

## Frontend Responsibilities
- Present the checkout flow as a SPA
- Manage multi-step checkout state
- Persist progress locally
- Validate customer, delivery, and card input
- Display success, decline, and error states clearly

## Status
Planning phase. 

