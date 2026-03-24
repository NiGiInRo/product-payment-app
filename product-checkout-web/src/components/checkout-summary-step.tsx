import type { CurrentProduct } from '../features/catalog/catalog.types'
import type {
  CheckoutCustomer,
  CheckoutDelivery,
} from '../features/checkout/checkout.types'
import type { CardBrand, CardFormValues } from '../utils/card'
import { getBrandLabel } from '../utils/card'

type CheckoutSummaryStepProps = {
  cardBrand: CardBrand
  cardForm: CardFormValues
  customer: CheckoutCustomer
  delivery: CheckoutDelivery
  product: CurrentProduct
  onEdit: () => void
}

export function CheckoutSummaryStep({
  cardBrand,
  cardForm,
  customer,
  delivery,
  product,
  onEdit,
}: CheckoutSummaryStepProps) {
  return (
    <section className="surface form-card">
      <div className="section-heading">
        <div>
          <p className="muted-label">Resumen final antes del pago</p>
          <h2 className="section-title">Montos congelados por backend</h2>
        </div>
      </div>

      <div className="summary-stack">
        <div className="summary-panel">
          <p className="muted-label">Producto</p>
          <strong>{product.name}</strong>
          <p className="status-copy">{product.description}</p>
        </div>

        <div className="summary-panel">
          <p className="muted-label">Pago</p>
          <strong>{getBrandLabel(cardBrand)}</strong>
          <p className="status-copy">Titular: {cardForm.holderName || 'Pendiente'}</p>
          <p className="status-copy">La tokenizacion ocurre al confirmar el pago.</p>
        </div>

        <div className="summary-panel">
          <p className="muted-label">Contacto</p>
          <strong>{customer.fullName}</strong>
          <p className="status-copy">{customer.email}</p>
          <p className="status-copy">{customer.phone}</p>
        </div>

        <div className="summary-panel">
          <p className="muted-label">Entrega</p>
          <strong>{delivery.addressLine1}</strong>
          <p className="status-copy">
            {[delivery.addressLine2, delivery.city, delivery.region]
              .filter(Boolean)
              .join(' - ')}
          </p>
          <p className="status-copy">
            {[delivery.postalCode, delivery.country].filter(Boolean).join(' - ')}
          </p>
          {delivery.notes ? <p className="status-copy">Notas: {delivery.notes}</p> : null}
        </div>
      </div>

      <div className="button-row">
        <button className="button button-secondary" onClick={onEdit} type="button">
          Editar datos
        </button>
      </div>
    </section>
  )
}
