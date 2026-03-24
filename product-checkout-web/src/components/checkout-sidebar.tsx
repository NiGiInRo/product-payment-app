import { Link } from 'react-router-dom'
import type { CurrentProduct } from '../features/catalog/catalog.types'
import type { PricingPreview } from '../features/checkout/checkout.types'
import type { PaymentState } from '../features/payment/payment.slice'
import { formatCurrency } from '../utils/formatters'

type CheckoutSidebarProps = {
  currentStep: 'details' | 'summary'
  onConfirmPayment: () => void
  onContinueToSummary: () => void
  payment: PaymentState
  pricingPreview: PricingPreview
  product: CurrentProduct
  transactionId: string | null
}

export function CheckoutSidebar({
  currentStep,
  onConfirmPayment,
  onContinueToSummary,
  payment,
  pricingPreview,
  product,
  transactionId,
}: CheckoutSidebarProps) {
  const isPayActionDisabled =
    payment.submissionStage !== 'idle' ||
    payment.configStatus === 'loading' ||
    !payment.checkoutConfig

  return (
    <aside className="checkout-sidebar">
      <section className="surface summary-card">
        <p className="muted-label">Resumen de compra</p>
        <h2 className="section-title section-title-small">Checkout actual</h2>

        <div className="checkout-preview checkout-preview-column">
          <div>
            <p className="muted-label">Producto</p>
            <strong>{product.name}</strong>
          </div>
          <strong>{formatCurrency(product.priceCents, product.currency)}</strong>
        </div>

        <dl className="price-breakdown">
          <div>
            <dt>Monto del producto</dt>
            <dd>
              {pricingPreview.amountCents !== null
                ? formatCurrency(pricingPreview.amountCents, 'COP')
                : 'Pendiente'}
            </dd>
          </div>
          <div>
            <dt>Base fee</dt>
            <dd>
              {pricingPreview.baseFeeCents !== null
                ? formatCurrency(pricingPreview.baseFeeCents, 'COP')
                : 'Se congelara al crear la transaccion'}
            </dd>
          </div>
          <div>
            <dt>Delivery fee</dt>
            <dd>
              {pricingPreview.deliveryFeeCents !== null
                ? formatCurrency(pricingPreview.deliveryFeeCents, 'COP')
                : 'Se congelara al crear la transaccion'}
            </dd>
          </div>
          <div className="price-breakdown-total">
            <dt>Total</dt>
            <dd>
              {pricingPreview.totalCents !== null
                ? formatCurrency(pricingPreview.totalCents, 'COP')
                : 'Pendiente'}
            </dd>
          </div>
        </dl>

        <div className="meta-notes">
          <p>
            Provider configuration:{' '}
            <strong>
              {payment.configStatus === 'succeeded'
                ? 'lista'
                : payment.configStatus === 'loading'
                  ? 'cargando'
                  : 'pendiente'}
            </strong>
          </p>
          <p>
            Transaccion local:{' '}
            <strong>{transactionId ? `creada (${transactionId})` : 'aun no creada'}</strong>
          </p>
          <p>
            Seguridad: <strong>la tarjeta nunca toca el backend en crudo</strong>
          </p>
        </div>

        <div className="action-footer">
          <Link className="button button-secondary" to="/">
            Volver al producto
          </Link>

          {currentStep === 'details' ? (
            <button className="button button-primary" onClick={onContinueToSummary} type="button">
              Continuar al resumen
            </button>
          ) : (
            <button
              className="button button-primary"
              disabled={isPayActionDisabled}
              onClick={onConfirmPayment}
              type="button"
            >
              {getPaymentButtonLabel(payment.submissionStage)}
            </button>
          )}
        </div>
      </section>
    </aside>
  )
}

function getPaymentButtonLabel(stage: PaymentState['submissionStage']) {
  switch (stage) {
    case 'tokenizing-card':
      return 'Tokenizando tarjeta...'
    case 'creating-transaction':
      return 'Creando transaccion...'
    case 'processing-payment':
      return 'Procesando pago...'
    case 'recovering-transaction':
      return 'Recuperando transaccion...'
    case 'loading-config':
      return 'Cargando configuracion...'
    default:
      return 'Pagar ahora'
  }
}
