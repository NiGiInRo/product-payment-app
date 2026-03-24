import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import catalogReducer from '../features/catalog/catalog.slice'
import checkoutReducer, {
  initialCheckoutState,
} from '../features/checkout/checkout.slice'
import paymentReducer, {
  initialPaymentState,
} from '../features/payment/payment.slice'
import { CheckoutResultPage } from './checkout-result-page'

const { fetchCurrentProductMock, navigateSpy } = vi.hoisted(() => ({
  fetchCurrentProductMock: vi.fn(() => ({ type: 'catalog/fetchCurrentProduct' })),
  navigateSpy: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('../features/catalog/catalog.slice', async () => {
  const actual = await vi.importActual<typeof import('../features/catalog/catalog.slice')>(
    '../features/catalog/catalog.slice',
  )

  return {
    ...actual,
    fetchCurrentProduct: fetchCurrentProductMock,
  }
})

vi.mock('../features/payment/payment.api', () => ({
  getTransactionStatus: vi.fn(),
}))

describe('CheckoutResultPage', () => {
  beforeEach(() => {
    fetchCurrentProductMock.mockClear()
    navigateSpy.mockClear()
  })

  it('renders the final declined state from store and returns to product', async () => {
    const user = userEvent.setup()

    const store = configureStore({
      reducer: {
        catalog: catalogReducer,
        checkout: checkoutReducer,
        payment: paymentReducer,
      },
      preloadedState: {
        catalog: {
          product: null,
          status: 'idle' as const,
          error: null,
        },
        checkout: initialCheckoutState,
        payment: {
          ...initialPaymentState,
          transactionId: 'txn-1',
          status: 'DECLINED' as const,
          statusReason: 'Fondos insuficientes',
          finalResult: {
            transactionId: 'txn-1',
            status: 'DECLINED' as const,
            statusReason: 'Fondos insuficientes',
            pricing: {
              amountCents: 12990000,
              baseFeeCents: 5000,
              deliveryFeeCents: 8000,
              totalCents: 13003000,
              currency: 'COP' as const,
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
          },
        },
      },
    })

    render(
      <Provider store={store}>
        <MemoryRouter>
          <CheckoutResultPage />
        </MemoryRouter>
      </Provider>,
    )

    expect(screen.getByRole('heading', { name: 'Pago rechazado' })).toBeInTheDocument()
    expect(screen.getByText('Fondos insuficientes')).toBeInTheDocument()
    expect(screen.getByText('Auriculares Inalambricos Pro')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Volver al producto' }))

    expect(fetchCurrentProductMock).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })
})
