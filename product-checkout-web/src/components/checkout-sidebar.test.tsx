import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { initialPaymentState } from '../features/payment/payment.slice'
import { CheckoutSidebar } from './checkout-sidebar'

const product = {
  id: 'p1',
  name: 'Auriculares Inalambricos Pro',
  description: 'Auriculares bluetooth con cancelacion de ruido.',
  priceCents: 12990000,
  stock: 8,
  imageUrl: 'https://example.com/image.jpg',
  currency: 'COP' as const,
}

describe('CheckoutSidebar', () => {
  it('renders the visual pricing preview before the transaction is created', () => {
    render(
      <MemoryRouter>
        <CheckoutSidebar
          currentStep="details"
          onConfirmPayment={vi.fn()}
          onContinueToSummary={vi.fn()}
          payment={initialPaymentState}
          pricingPreview={{
            amountCents: product.priceCents,
            baseFeeCents: null,
            deliveryFeeCents: null,
            totalCents: null,
            currency: 'COP',
            isEstimated: true,
          }}
          product={product}
          transactionId={null}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Se congelara al crear la transaccion')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Continuar al resumen' })).toBeInTheDocument()
    expect(screen.getByText('aun no creada')).toBeInTheDocument()
  })

  it('shows the processing CTA when the transaction is already in payment stage', () => {
    render(
      <MemoryRouter>
        <CheckoutSidebar
          currentStep="summary"
          onConfirmPayment={vi.fn()}
          onContinueToSummary={vi.fn()}
          payment={{
            ...initialPaymentState,
            checkoutConfig: {
              publicKey: 'pub_stagtest_x',
              acceptanceToken: 'acceptance-token',
              legalLinks: {
                acceptance: 'https://example.com/acceptance',
              },
            },
            configStatus: 'succeeded',
            submissionStage: 'processing-payment',
          }}
          pricingPreview={{
            amountCents: 12990000,
            baseFeeCents: 5000,
            deliveryFeeCents: 8000,
            totalCents: 13003000,
            currency: 'COP',
            isEstimated: false,
          }}
          product={product}
          transactionId="txn-1"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText((_, element) => element?.textContent === '$\u00a0130.030'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Procesando pago...' }),
    ).toBeDisabled()
  })
})
