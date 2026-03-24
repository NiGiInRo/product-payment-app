import {
  initialCheckoutState,
  type CheckoutState,
} from '../features/checkout/checkout.slice'
import {
  initialPaymentState,
  type PaymentState,
} from '../features/payment/payment.slice'

const STORAGE_KEY = 'product-checkout-web'

type PersistedCheckoutState = Omit<CheckoutState, 'restoredFromStorage'>

type PersistedRootState = {
  checkout: PersistedCheckoutState
  payment: Pick<PaymentState, 'transactionId'>
}

export type PreloadedAppState = {
  checkout: CheckoutState
  payment: PaymentState
}

export function loadPersistedState(): PreloadedAppState | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return undefined
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedRootState>

    return {
      checkout: {
        ...initialCheckoutState,
        ...parsedValue.checkout,
        customer: {
          ...initialCheckoutState.customer,
          ...parsedValue.checkout?.customer,
        },
        delivery: {
          ...initialCheckoutState.delivery,
          ...parsedValue.checkout?.delivery,
        },
        pricingPreview: {
          ...initialCheckoutState.pricingPreview,
          ...parsedValue.checkout?.pricingPreview,
        },
        legalAcceptanceFlags: {
          ...initialCheckoutState.legalAcceptanceFlags,
          ...parsedValue.checkout?.legalAcceptanceFlags,
        },
        restoredFromStorage: Boolean(parsedValue.checkout),
      },
      payment: {
        ...initialPaymentState,
        transactionId: parsedValue.payment?.transactionId ?? null,
      },
    }
  } catch {
    return undefined
  }
}

export function savePersistedState(state: PreloadedAppState) {
  if (typeof window === 'undefined') {
    return
  }

  const payload: PersistedRootState = {
    checkout: {
      currentStep: state.checkout.currentStep,
      customer: state.checkout.customer,
      delivery: state.checkout.delivery,
      pricingPreview: state.checkout.pricingPreview,
      legalAcceptanceFlags: state.checkout.legalAcceptanceFlags,
    },
    payment: {
      transactionId: state.payment.transactionId,
    },
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
