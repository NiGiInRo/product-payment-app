import type {
  CheckoutCustomer,
  CheckoutDelivery,
  PricingPreview,
} from '../checkout/checkout.types'

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR'

export type CheckoutConfig = {
  publicKey: string
  acceptanceToken: string
  personalDataAuthToken?: string
  legalLinks: {
    acceptance: string
    personalDataAuthorization?: string
  }
}

export type FrozenPricing = {
  amountCents: number
  baseFeeCents: number
  deliveryFeeCents: number
  totalCents: number
  currency: string
}

export type CreatePendingTransactionResponse = {
  transactionId: string
  status: 'PENDING'
  pricing: Omit<FrozenPricing, 'currency'>
}

export type TransactionResult = {
  transactionId: string
  status: TransactionStatus
  statusReason?: string | null
  pricing: FrozenPricing
  product: {
    id: string
    name: string
    description: string
    imageUrl: string
  }
  customer: CheckoutCustomer & {
    id: string
  }
  delivery: CheckoutDelivery & {
    id: string
    addressLine2?: string | null
    region?: string | null
    postalCode?: string | null
    notes?: string | null
  }
}

export type PaymentSubmissionStage =
  | 'idle'
  | 'loading-config'
  | 'tokenizing-card'
  | 'creating-transaction'
  | 'processing-payment'
  | 'recovering-transaction'

export function toPricingPreview(pricing: FrozenPricing): PricingPreview {
  return {
    amountCents: pricing.amountCents,
    baseFeeCents: pricing.baseFeeCents,
    deliveryFeeCents: pricing.deliveryFeeCents,
    totalCents: pricing.totalCents,
    currency: pricing.currency as 'COP',
    isEstimated: false,
  }
}
