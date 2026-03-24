import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store/store'
import type { CurrentProduct } from '../catalog/catalog.types'
import type {
  CheckoutCustomer,
  CheckoutDelivery,
  CheckoutStep,
  LegalAcceptanceFlags,
  PricingPreview,
} from './checkout.types'
import type { FrozenPricing } from '../payment/payment.types'

export type CheckoutState = {
  currentStep: CheckoutStep
  customer: CheckoutCustomer
  delivery: CheckoutDelivery
  pricingPreview: PricingPreview
  legalAcceptanceFlags: LegalAcceptanceFlags
  restoredFromStorage: boolean
}

export const initialCheckoutState: CheckoutState = {
  currentStep: 'details',
  customer: {
    fullName: '',
    email: '',
    phone: '',
  },
  delivery: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Colombia',
    notes: '',
  },
  pricingPreview: {
    amountCents: null,
    baseFeeCents: null,
    deliveryFeeCents: null,
    totalCents: null,
    currency: null,
    isEstimated: true,
  },
  legalAcceptanceFlags: {
    termsAccepted: false,
    personalDataAccepted: false,
  },
  restoredFromStorage: false,
}

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: initialCheckoutState,
  reducers: {
    setCheckoutStep(state, action: PayloadAction<CheckoutStep>) {
      state.currentStep = action.payload
    },
    updateCheckoutCustomer(state, action: PayloadAction<Partial<CheckoutCustomer>>) {
      state.customer = {
        ...state.customer,
        ...action.payload,
      }
    },
    updateCheckoutDelivery(state, action: PayloadAction<Partial<CheckoutDelivery>>) {
      state.delivery = {
        ...state.delivery,
        ...action.payload,
      }
    },
    updateLegalAcceptanceFlags(
      state,
      action: PayloadAction<Partial<LegalAcceptanceFlags>>,
    ) {
      state.legalAcceptanceFlags = {
        ...state.legalAcceptanceFlags,
        ...action.payload,
      }
    },
    syncPricingPreviewFromProduct(state, action: PayloadAction<CurrentProduct>) {
      state.pricingPreview = {
        amountCents: action.payload.priceCents,
        baseFeeCents: null,
        deliveryFeeCents: null,
        totalCents: null,
        currency: action.payload.currency,
        isEstimated: true,
      }
    },
    syncPricingPreviewFromTransaction(state, action: PayloadAction<FrozenPricing>) {
      state.pricingPreview = {
        amountCents: action.payload.amountCents,
        baseFeeCents: action.payload.baseFeeCents,
        deliveryFeeCents: action.payload.deliveryFeeCents,
        totalCents: action.payload.totalCents,
        currency: action.payload.currency as 'COP',
        isEstimated: false,
      }
    },
    hydrateCheckoutFromTransaction(
      state,
      action: PayloadAction<{
        customer: CheckoutCustomer
        delivery: CheckoutDelivery
        pricingPreview: PricingPreview
      }>,
    ) {
      state.customer = action.payload.customer
      state.delivery = action.payload.delivery
      state.pricingPreview = action.payload.pricingPreview
    },
    dismissRestoredBanner(state) {
      state.restoredFromStorage = false
    },
    resetCheckoutState(state) {
      state.currentStep = 'details'
      state.customer = initialCheckoutState.customer
      state.delivery = initialCheckoutState.delivery
      state.pricingPreview = initialCheckoutState.pricingPreview
      state.legalAcceptanceFlags = initialCheckoutState.legalAcceptanceFlags
      state.restoredFromStorage = false
    },
  },
})

export const {
  dismissRestoredBanner,
  hydrateCheckoutFromTransaction,
  resetCheckoutState,
  setCheckoutStep,
  syncPricingPreviewFromProduct,
  syncPricingPreviewFromTransaction,
  updateCheckoutCustomer,
  updateCheckoutDelivery,
  updateLegalAcceptanceFlags,
} = checkoutSlice.actions

export const selectCheckout = (state: RootState) => state.checkout
export const selectCheckoutStep = (state: RootState) => state.checkout.currentStep
export const selectCheckoutCustomer = (state: RootState) => state.checkout.customer
export const selectCheckoutDelivery = (state: RootState) => state.checkout.delivery
export const selectCheckoutPricingPreview = (state: RootState) =>
  state.checkout.pricingPreview
export const selectCheckoutLegalFlags = (state: RootState) =>
  state.checkout.legalAcceptanceFlags
export const selectCheckoutRestoredFlag = (state: RootState) =>
  state.checkout.restoredFromStorage

export default checkoutSlice.reducer
