import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import catalogReducer from '../features/catalog/catalog.slice'
import checkoutReducer, {
  initialCheckoutState,
} from '../features/checkout/checkout.slice'
import paymentReducer, {
  initialPaymentState,
} from '../features/payment/payment.slice'
import { CheckoutPage } from './checkout-page'
import { getTransactionStatus } from '../features/payment/payment.api'

vi.mock('../features/payment/payment.api', () => ({
  createPendingTransaction: vi.fn(),
  getCheckoutConfig: vi.fn(),
  getTransactionStatus: vi.fn(),
  processTransactionPayment: vi.fn(),
  tokenizeCard: vi.fn(),
}))

const mockedGetTransactionStatus = vi.mocked(getTransactionStatus)

describe('CheckoutPage', () => {
  beforeEach(() => {
    mockedGetTransactionStatus.mockReset()
  })

  it('returns to details when storage restores an impossible summary step without card or transaction', async () => {
    const store = configureStore({
      reducer: {
        catalog: catalogReducer,
        checkout: checkoutReducer,
        payment: paymentReducer,
      },
      preloadedState: {
        catalog: {
          product: {
            id: 'p1',
            name: 'Auriculares Inalambricos Pro',
            description: 'Auriculares bluetooth con cancelacion de ruido.',
            priceCents: 12990000,
            stock: 8,
            imageUrl: 'https://example.com/image.jpg',
            currency: 'COP' as const,
          },
          status: 'succeeded' as const,
          error: null,
        },
        checkout: {
          ...initialCheckoutState,
          currentStep: 'summary' as const,
          restoredFromStorage: true,
          customer: {
            fullName: 'Nicolas Infante',
            email: 'nicolas@example.com',
            phone: '3001234567',
          },
          delivery: {
            addressLine1: 'Calle 123 # 45 - 67',
            addressLine2: '402',
            city: 'Bogota',
            region: 'Cundinamarca',
            postalCode: '110111',
            country: 'Colombia',
            notes: 'Porteria',
          },
        },
        payment: {
          ...initialPaymentState,
          checkoutConfig: {
            publicKey: 'pub_stagtest_x',
            acceptanceToken: 'acceptance-token',
            legalLinks: {
              acceptance: 'https://example.com/acceptance',
            },
          },
          configStatus: 'succeeded' as const,
        },
      },
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CheckoutPage />
        </MemoryRouter>
      </Provider>,
    )

    expect(await screen.findByRole('heading', { name: 'Tarjeta' })).toBeInTheDocument()
    expect(screen.queryByText('Montos congelados por backend')).not.toBeInTheDocument()
  })

  it('clears a non-retryable transaction when recovery finds a technical error', async () => {
    mockedGetTransactionStatus.mockResolvedValue({
      transactionId: 'txn-1',
      status: 'ERROR',
      statusReason: 'Technical error',
      pricing: {
        amountCents: 12990000,
        baseFeeCents: 5000,
        deliveryFeeCents: 8000,
        totalCents: 13003000,
        currency: 'COP',
      },
      product: {
        id: 'p1',
        name: 'Auriculares Inalambricos Pro',
        description: 'Auriculares bluetooth con cancelacion de ruido.',
        imageUrl: 'https://example.com/image.jpg',
      },
      customer: {
        id: 'c1',
        fullName: 'Nicolas Infante',
        email: 'nicolas@example.com',
        phone: '3001234567',
      },
      delivery: {
        id: 'd1',
        addressLine1: 'Calle 123 # 45 - 67',
        addressLine2: '402',
        city: 'Bogota',
        region: 'Cundinamarca',
        postalCode: '110111',
        country: 'Colombia',
        notes: 'Porteria',
      },
    })

    const store = configureStore({
      reducer: {
        catalog: catalogReducer,
        checkout: checkoutReducer,
        payment: paymentReducer,
      },
      preloadedState: {
        catalog: {
          product: {
            id: 'p1',
            name: 'Auriculares Inalambricos Pro',
            description: 'Auriculares bluetooth con cancelacion de ruido.',
            priceCents: 12990000,
            stock: 8,
            imageUrl: 'https://example.com/image.jpg',
            currency: 'COP' as const,
          },
          status: 'succeeded' as const,
          error: null,
        },
        checkout: {
          ...initialCheckoutState,
          currentStep: 'details' as const,
        },
        payment: {
          ...initialPaymentState,
          checkoutConfig: {
            publicKey: 'pub_stagtest_x',
            acceptanceToken: 'acceptance-token',
            legalLinks: {
              acceptance: 'https://example.com/acceptance',
            },
          },
          configStatus: 'succeeded' as const,
          transactionId: 'txn-1',
          status: 'PENDING' as const,
        },
      },
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CheckoutPage />
        </MemoryRouter>
      </Provider>,
    )

    expect(
      await screen.findByText(
        'La transaccion anterior termino con un error tecnico y no se puede reutilizar. Puedes intentar de nuevo.',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByText('aun no creada')).toBeInTheDocument()
  })
})
