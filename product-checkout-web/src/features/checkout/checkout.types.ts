import type { CurrencyCode } from '../catalog/catalog.types'

export type CheckoutStep = 'details' | 'summary'

export type CheckoutCustomer = {
  fullName: string
  email: string
  phone: string
}

export type CheckoutDelivery = {
  addressLine1: string
  addressLine2: string
  city: string
  region: string
  postalCode: string
  country: string
  notes: string
}

export type LegalAcceptanceFlags = {
  termsAccepted: boolean
  personalDataAccepted: boolean
}

export type PricingPreview = {
  amountCents: number | null
  baseFeeCents: number | null
  deliveryFeeCents: number | null
  totalCents: number | null
  currency: CurrencyCode | null
  isEstimated: boolean
}
