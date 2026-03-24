import {
  loadPersistedState,
  savePersistedState,
  type PreloadedAppState,
} from './persistence'
import { initialCheckoutState } from '../features/checkout/checkout.slice'
import { initialPaymentState } from '../features/payment/payment.slice'

describe('persistence', () => {
  const storageKey = 'product-checkout-web'

  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists only non-sensitive checkout data and transaction id', () => {
    const state: PreloadedAppState = {
      checkout: {
        ...initialCheckoutState,
        currentStep: 'summary',
        customer: {
          fullName: 'Nicolas',
          email: 'nicolas@example.com',
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Calle 123',
          addressLine2: '402',
          city: 'Bogota',
          region: 'Cundinamarca',
          postalCode: '110111',
          country: 'Colombia',
          notes: 'Porteria',
        },
        legalAcceptanceFlags: {
          termsAccepted: true,
          personalDataAccepted: true,
        },
      },
      payment: {
        ...initialPaymentState,
        transactionId: 'txn-1',
      },
    }

    savePersistedState(state)

    const rawValue = window.localStorage.getItem(storageKey)
    expect(rawValue).toContain('txn-1')
    expect(rawValue).not.toContain('4242424242424242')
    expect(rawValue).not.toContain('"cvc"')
  })

  it('rehydrates persisted state and marks it as restored', () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        checkout: {
          currentStep: 'summary',
          customer: {
            fullName: 'Nicolas',
            email: 'nicolas@example.com',
            phone: '3001234567',
          },
          delivery: {
            addressLine1: 'Calle 123',
            city: 'Bogota',
            country: 'Colombia',
          },
          pricingPreview: {
            amountCents: 12990000,
            baseFeeCents: 5000,
            deliveryFeeCents: 8000,
            totalCents: 13003000,
            currency: 'COP',
            isEstimated: false,
          },
          legalAcceptanceFlags: {
            termsAccepted: true,
            personalDataAccepted: false,
          },
        },
        payment: {
          transactionId: 'txn-1',
        },
      }),
    )

    const loadedState = loadPersistedState()

    expect(loadedState?.checkout.currentStep).toBe('summary')
    expect(loadedState?.checkout.restoredFromStorage).toBe(true)
    expect(loadedState?.payment.transactionId).toBe('txn-1')
  })

  it('returns undefined when persisted state is invalid JSON', () => {
    window.localStorage.setItem(storageKey, '{invalid-json')

    expect(loadPersistedState()).toBeUndefined()
  })
})
