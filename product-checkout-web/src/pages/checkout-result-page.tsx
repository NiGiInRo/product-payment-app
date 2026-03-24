import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCurrentProduct } from '../features/catalog/catalog.slice'
import {
  hydrateCheckoutFromTransaction,
  resetCheckoutState,
  syncPricingPreviewFromTransaction,
} from '../features/checkout/checkout.slice'
import { getTransactionStatus } from '../features/payment/payment.api'
import {
  clearPaymentError,
  resetPaymentState,
  selectPayment,
  selectPaymentFinalResult,
  selectPaymentTransactionId,
  setPaymentError,
  setPaymentResult,
  setPaymentSubmissionStage,
} from '../features/payment/payment.slice'
import { toPricingPreview } from '../features/payment/payment.types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { formatCurrency } from '../utils/formatters'

export function CheckoutResultPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const transactionId = useAppSelector(selectPaymentTransactionId)
  const finalResult = useAppSelector(selectPaymentFinalResult)
  const payment = useAppSelector(selectPayment)

  useEffect(() => {
    async function recoverResult() {
      if (!transactionId || finalResult) {
        return
      }

      try {
        dispatch(setPaymentSubmissionStage('recovering-transaction'))
        const recoveredTransaction = await getTransactionStatus(transactionId)
        dispatch(setPaymentResult(recoveredTransaction))
        dispatch(
          hydrateCheckoutFromTransaction({
            customer: recoveredTransaction.customer,
            delivery: {
              addressLine1: recoveredTransaction.delivery.addressLine1,
              addressLine2: recoveredTransaction.delivery.addressLine2 ?? '',
              city: recoveredTransaction.delivery.city,
              region: recoveredTransaction.delivery.region ?? '',
              postalCode: recoveredTransaction.delivery.postalCode ?? '',
              country: recoveredTransaction.delivery.country,
              notes: recoveredTransaction.delivery.notes ?? '',
            },
            pricingPreview: toPricingPreview(recoveredTransaction.pricing),
          }),
        )
        dispatch(syncPricingPreviewFromTransaction(recoveredTransaction.pricing))
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No fue posible recuperar el resultado final.'
        dispatch(setPaymentError(message))
      } finally {
        dispatch(setPaymentSubmissionStage('idle'))
      }
    }

    void recoverResult()
  }, [dispatch, finalResult, transactionId])

  async function handleBackToProduct() {
    dispatch(clearPaymentError())
    dispatch(resetCheckoutState())
    dispatch(resetPaymentState())
    void dispatch(fetchCurrentProduct())
    navigate('/')
  }

  if (!transactionId && !finalResult) {
    return (
      <main className="page-shell">
        <section className="surface surface-tight">
          <span className="eyebrow">Sin transaccion</span>
          <h1 className="page-title">No hay un resultado disponible</h1>
          <p className="page-copy">
            Para ver un resultado final primero debes crear y procesar una transaccion.
          </p>
          <button className="button button-primary" onClick={() => navigate('/')} type="button">
            Volver al producto
          </button>
        </section>
      </main>
    )
  }

  if (!finalResult) {
    return (
      <main className="page-shell">
        <section className="surface surface-tight">
          <span className="eyebrow">Recuperando</span>
          <h1 className="page-title">Buscando el estado final de tu compra</h1>
          <p className="page-copy">
            {payment.error || 'Consultando la transaccion creada para reconstruir el resultado.'}
          </p>
        </section>
      </main>
    )
  }

  const resultToneClass =
    finalResult.status === 'APPROVED'
      ? 'result-card-approved'
      : finalResult.status === 'DECLINED'
        ? 'result-card-declined'
        : 'result-card-error'

  return (
    <main className="page-shell">
      <section className={`surface result-card ${resultToneClass}`}>
        <span className="eyebrow">Estado final</span>
        <h1 className="page-title">{getResultTitle(finalResult.status)}</h1>
        <p className="page-copy">
          {finalResult.statusReason || 'La transaccion fue procesada sin mensaje adicional.'}
        </p>

        <div className="result-grid">
          <div className="summary-panel">
            <p className="muted-label">Transaccion</p>
            <strong>{finalResult.transactionId}</strong>
            <p className="status-copy">Estado: {finalResult.status}</p>
          </div>

          <div className="summary-panel">
            <p className="muted-label">Producto</p>
            <strong>{finalResult.product.name}</strong>
            <p className="status-copy">{finalResult.product.description}</p>
          </div>

          <div className="summary-panel">
            <p className="muted-label">Cliente</p>
            <strong>{finalResult.customer.fullName}</strong>
            <p className="status-copy">{finalResult.customer.email}</p>
            <p className="status-copy">{finalResult.customer.phone}</p>
          </div>

          <div className="summary-panel">
            <p className="muted-label">Entrega</p>
            <strong>{finalResult.delivery.addressLine1}</strong>
            <p className="status-copy">
              {[
                finalResult.delivery.addressLine2,
                finalResult.delivery.city,
                finalResult.delivery.region,
              ]
                .filter(Boolean)
                .join(' - ')}
            </p>
            <p className="status-copy">
              {[finalResult.delivery.postalCode, finalResult.delivery.country]
                .filter(Boolean)
                .join(' - ')}
            </p>
          </div>
        </div>

        <dl className="price-breakdown result-pricing">
          <div>
            <dt>Producto</dt>
            <dd>{formatCurrency(finalResult.pricing.amountCents, 'COP')}</dd>
          </div>
          <div>
            <dt>Base fee</dt>
            <dd>{formatCurrency(finalResult.pricing.baseFeeCents, 'COP')}</dd>
          </div>
          <div>
            <dt>Delivery fee</dt>
            <dd>{formatCurrency(finalResult.pricing.deliveryFeeCents, 'COP')}</dd>
          </div>
          <div className="price-breakdown-total">
            <dt>Total</dt>
            <dd>{formatCurrency(finalResult.pricing.totalCents, 'COP')}</dd>
          </div>
        </dl>

        <div className="action-footer action-footer-inline">
          <button className="button button-primary" onClick={handleBackToProduct} type="button">
            Volver al producto
          </button>
        </div>
      </section>
    </main>
  )
}

function getResultTitle(status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING') {
  switch (status) {
    case 'APPROVED':
      return 'Pago aprobado'
    case 'DECLINED':
      return 'Pago rechazado'
    case 'ERROR':
      return 'Pago con error tecnico'
    case 'PENDING':
      return 'Pago pendiente'
  }
}
