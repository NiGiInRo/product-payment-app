import type { CheckoutConfig } from '../features/payment/payment.types'
import type {
  CheckoutCustomer,
  CheckoutDelivery,
  LegalAcceptanceFlags,
} from '../features/checkout/checkout.types'
import type { CardFormValues } from '../utils/card'
import type { CheckoutValidationErrors } from '../utils/checkout-validation'
import { getBrandLabel, type CardBrand } from '../utils/card'

type CheckoutDetailsStepProps = {
  cardBrand: CardBrand
  cardForm: CardFormValues
  checkoutConfig: CheckoutConfig | null
  customer: CheckoutCustomer
  delivery: CheckoutDelivery
  errors: CheckoutValidationErrors
  legalFlags: LegalAcceptanceFlags
  requiresPersonalDataAuthorization: boolean
  onCardChange: (field: keyof CardFormValues, value: string) => void
  onCustomerChange: (field: keyof CheckoutCustomer, value: string) => void
  onDeliveryChange: (field: keyof CheckoutDelivery, value: string) => void
  onLegalFlagChange: (field: keyof LegalAcceptanceFlags, value: boolean) => void
}

export function CheckoutDetailsStep({
  cardBrand,
  cardForm,
  checkoutConfig,
  customer,
  delivery,
  errors,
  legalFlags,
  requiresPersonalDataAuthorization,
  onCardChange,
  onCustomerChange,
  onDeliveryChange,
  onLegalFlagChange,
}: CheckoutDetailsStepProps) {
  return (
    <>
      <section className="surface form-card">
        <div className="section-heading">
          <div>
            <p className="muted-label">Seccion 1</p>
            <h2 className="section-title">Tarjeta</h2>
          </div>
          <div className="brand-pills" aria-label="Marca detectada">
            <span className={`brand-pill ${cardBrand === 'visa' ? 'brand-pill-active' : ''}`}>
              Visa
            </span>
            <span
              className={`brand-pill ${cardBrand === 'mastercard' ? 'brand-pill-active' : ''}`}
            >
              Mastercard
            </span>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span className="field-label">Titular</span>
            <input
              autoComplete="cc-name"
              className={errors.holderName ? 'field-input field-input-error' : 'field-input'}
              onChange={(event) => onCardChange('holderName', event.target.value)}
              placeholder="Nombre como aparece en la tarjeta"
              type="text"
              value={cardForm.holderName}
            />
            {errors.holderName ? <span className="field-error">{errors.holderName}</span> : null}
          </label>

          <label className="field field-span-2">
            <span className="field-label">Numero de tarjeta</span>
            <input
              autoComplete="cc-number"
              className={errors.cardNumber ? 'field-input field-input-error' : 'field-input'}
              inputMode="numeric"
              onChange={(event) => onCardChange('cardNumber', event.target.value)}
              placeholder="4242 4242 4242 4242"
              type="text"
              value={cardForm.cardNumber}
            />
            <div className="field-meta">
              <span>{getBrandLabel(cardBrand)}</span>
              <span>Se tokeniza contra el sandbox provider</span>
            </div>
            {errors.cardNumber ? <span className="field-error">{errors.cardNumber}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">Expiracion</span>
            <input
              autoComplete="cc-exp"
              className={errors.expiry ? 'field-input field-input-error' : 'field-input'}
              inputMode="numeric"
              onChange={(event) => onCardChange('expiry', event.target.value)}
              placeholder="MM/AA"
              type="text"
              value={cardForm.expiry}
            />
            {errors.expiry ? <span className="field-error">{errors.expiry}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">CVC</span>
            <input
              autoComplete="cc-csc"
              className={errors.cvc ? 'field-input field-input-error' : 'field-input'}
              inputMode="numeric"
              onChange={(event) => onCardChange('cvc', event.target.value)}
              placeholder="123"
              type="password"
              value={cardForm.cvc}
            />
            {errors.cvc ? <span className="field-error">{errors.cvc}</span> : null}
          </label>
        </div>
      </section>

      <section className="surface form-card">
        <div className="section-heading">
          <div>
            <p className="muted-label">Seccion 2</p>
            <h2 className="section-title">Contacto y entrega</h2>
          </div>
        </div>

        <div className="form-grid">
          <label className="field field-span-2">
            <span className="field-label">Nombre completo</span>
            <input
              autoComplete="name"
              className={errors.fullName ? 'field-input field-input-error' : 'field-input'}
              onChange={(event) => onCustomerChange('fullName', event.target.value)}
              placeholder="Nicolas Infante"
              type="text"
              value={customer.fullName}
            />
            {errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">Correo</span>
            <input
              autoComplete="email"
              className={errors.email ? 'field-input field-input-error' : 'field-input'}
              onChange={(event) => onCustomerChange('email', event.target.value)}
              placeholder="nicolas@example.com"
              type="email"
              value={customer.email}
            />
            {errors.email ? <span className="field-error">{errors.email}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">Telefono</span>
            <input
              autoComplete="tel"
              className={errors.phone ? 'field-input field-input-error' : 'field-input'}
              inputMode="tel"
              onChange={(event) => onCustomerChange('phone', event.target.value)}
              placeholder="3001234567"
              type="tel"
              value={customer.phone}
            />
            {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
          </label>

          <label className="field field-span-2">
            <span className="field-label">Direccion principal</span>
            <input
              autoComplete="shipping address-line1"
              className={errors.addressLine1 ? 'field-input field-input-error' : 'field-input'}
              onChange={(event) => onDeliveryChange('addressLine1', event.target.value)}
              placeholder="Calle 123 # 45 - 67"
              type="text"
              value={delivery.addressLine1}
            />
            {errors.addressLine1 ? <span className="field-error">{errors.addressLine1}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">Apto o complemento</span>
            <input
              autoComplete="shipping address-line2"
              className="field-input"
              onChange={(event) => onDeliveryChange('addressLine2', event.target.value)}
              placeholder="Apartamento 402"
              type="text"
              value={delivery.addressLine2}
            />
          </label>

          <label className="field">
            <span className="field-label">Ciudad</span>
            <input
              autoComplete="shipping address-level2"
              className={errors.city ? 'field-input field-input-error' : 'field-input'}
              onChange={(event) => onDeliveryChange('city', event.target.value)}
              placeholder="Bogota"
              type="text"
              value={delivery.city}
            />
            {errors.city ? <span className="field-error">{errors.city}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">Region</span>
            <input
              autoComplete="shipping address-level1"
              className="field-input"
              onChange={(event) => onDeliveryChange('region', event.target.value)}
              placeholder="Cundinamarca"
              type="text"
              value={delivery.region}
            />
          </label>

          <label className="field">
            <span className="field-label">Codigo postal</span>
            <input
              autoComplete="shipping postal-code"
              className="field-input"
              inputMode="numeric"
              onChange={(event) => onDeliveryChange('postalCode', event.target.value)}
              placeholder="110111"
              type="text"
              value={delivery.postalCode}
            />
          </label>

          <label className="field">
            <span className="field-label">Pais</span>
            <input
              autoComplete="shipping country-name"
              className={errors.country ? 'field-input field-input-error' : 'field-input'}
              onChange={(event) => onDeliveryChange('country', event.target.value)}
              placeholder="Colombia"
              type="text"
              value={delivery.country}
            />
            {errors.country ? <span className="field-error">{errors.country}</span> : null}
          </label>

          <label className="field field-span-2">
            <span className="field-label">Notas de entrega</span>
            <textarea
              className="field-input field-textarea"
              onChange={(event) => onDeliveryChange('notes', event.target.value)}
              placeholder="Entregar en porteria"
              rows={3}
              value={delivery.notes}
            />
          </label>
        </div>

        <div className="checkbox-group">
          <label className="checkbox-field">
            <input
              checked={legalFlags.termsAccepted}
              onChange={(event) => onLegalFlagChange('termsAccepted', event.target.checked)}
              type="checkbox"
            />
            <span>
              Acepto los terminos del payment provider.{' '}
              {checkoutConfig?.legalLinks.acceptance ? (
                <a
                  className="inline-link"
                  href={checkoutConfig.legalLinks.acceptance}
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver consentimiento
                </a>
              ) : null}
            </span>
          </label>
          {errors.termsAccepted ? <span className="field-error">{errors.termsAccepted}</span> : null}

          {requiresPersonalDataAuthorization ? (
            <>
              <label className="checkbox-field">
                <input
                  checked={legalFlags.personalDataAccepted}
                  onChange={(event) =>
                    onLegalFlagChange('personalDataAccepted', event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  Autorizo el tratamiento de datos.{' '}
                  {checkoutConfig?.legalLinks.personalDataAuthorization ? (
                    <a
                      className="inline-link"
                      href={checkoutConfig.legalLinks.personalDataAuthorization}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Ver autorizacion
                    </a>
                  ) : null}
                </span>
              </label>
              {errors.personalDataAccepted ? (
                <span className="field-error">{errors.personalDataAccepted}</span>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}
