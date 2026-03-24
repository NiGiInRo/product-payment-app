import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckoutDetailsStep } from '../components/checkout-details-step'
import { CheckoutSidebar } from '../components/checkout-sidebar'
import { CheckoutSummaryStep } from '../components/checkout-summary-step'
import {
  dismissRestoredBanner,
  hydrateCheckoutFromTransaction,
  selectCheckoutCustomer,
  selectCheckoutDelivery,
  selectCheckoutLegalFlags,
  selectCheckoutPricingPreview,
  selectCheckoutRestoredFlag,
  selectCheckoutStep,
  setCheckoutStep,
  syncPricingPreviewFromProduct,
  syncPricingPreviewFromTransaction,
  updateCheckoutCustomer,
  updateCheckoutDelivery,
  updateLegalAcceptanceFlags,
} from '../features/checkout/checkout.slice'
import {
  fetchCurrentProduct,
  selectCatalogError,
  selectCatalogStatus,
  selectCurrentProduct,
} from '../features/catalog/catalog.slice'
import {
  createPendingTransaction,
  getCheckoutConfig,
  getTransactionStatus,
  processTransactionPayment,
  tokenizeCard,
} from '../features/payment/payment.api'
import {
  clearPaymentAttempt,
  clearPaymentError,
  selectCheckoutConfig,
  selectPayment,
  selectPaymentFinalResult,
  selectPaymentTransactionId,
  setCheckoutConfig,
  setCheckoutConfigError,
  setPaymentError,
  setPaymentPending,
  setPaymentResult,
  setPaymentSubmissionStage,
  startCheckoutConfigLoad,
} from '../features/payment/payment.slice'
import { toPricingPreview } from '../features/payment/payment.types'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  sanitizeDigits,
  type CardFormValues,
} from '../utils/card'
import {
  validateCheckoutDetails,
  type CheckoutValidationErrors,
} from '../utils/checkout-validation'

const emptyCardForm: CardFormValues = {
  holderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
}

export function CheckoutPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const product = useAppSelector(selectCurrentProduct)
  const catalogStatus = useAppSelector(selectCatalogStatus)
  const catalogError = useAppSelector(selectCatalogError)
  const currentStep = useAppSelector(selectCheckoutStep)
  const customer = useAppSelector(selectCheckoutCustomer)
  const delivery = useAppSelector(selectCheckoutDelivery)
  const pricingPreview = useAppSelector(selectCheckoutPricingPreview)
  const legalFlags = useAppSelector(selectCheckoutLegalFlags)
  const restoredFromStorage = useAppSelector(selectCheckoutRestoredFlag)
  const checkoutConfig = useAppSelector(selectCheckoutConfig)
  const transactionId = useAppSelector(selectPaymentTransactionId)
  const finalResult = useAppSelector(selectPaymentFinalResult)
  const payment = useAppSelector(selectPayment)
  const [cardForm, setCardForm] = useState<CardFormValues>(emptyCardForm)
  const [errors, setErrors] = useState<CheckoutValidationErrors>({})
  const requiresPersonalDataAuthorization = Boolean(
    checkoutConfig?.personalDataAuthToken || checkoutConfig?.legalLinks.personalDataAuthorization,
  )

  useEffect(() => {
    if (catalogStatus === 'idle') void dispatch(fetchCurrentProduct())
  }, [catalogStatus, dispatch])

  useEffect(() => {
    if (product && pricingPreview.isEstimated) dispatch(syncPricingPreviewFromProduct(product))
  }, [dispatch, pricingPreview.isEstimated, product])

  useEffect(() => {
    if (payment.configStatus !== 'idle') return
    ;(async () => {
      try {
        dispatch(startCheckoutConfigLoad())
        dispatch(setCheckoutConfig(await getCheckoutConfig()))
      } catch (error) {
        dispatch(
          setCheckoutConfigError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar la configuracion del checkout.',
          ),
        )
      }
    })()
  }, [dispatch, payment.configStatus])

  useEffect(() => {
    if (restoredFromStorage && currentStep === 'summary' && !transactionId && !cardForm.cardNumber) {
      dispatch(setCheckoutStep('details'))
    }
  }, [cardForm.cardNumber, currentStep, dispatch, restoredFromStorage, transactionId])

  useEffect(() => {
    if (!transactionId || payment.submissionStage !== 'idle' || finalResult) return
    ;(async () => {
      try {
        dispatch(setPaymentSubmissionStage('recovering-transaction'))
        const recovered = await getTransactionStatus(transactionId)
        syncRecoveredTransaction(dispatch, recovered)
        if (recovered.status === 'PENDING') {
          dispatch(setPaymentPending({ transactionId }))
          dispatch(setPaymentError('Recuperamos una transaccion pendiente. Reingresa la tarjeta para continuar.'))
          dispatch(setCheckoutStep('details'))
          return
        }
        if (recovered.status === 'ERROR') {
          dispatch(clearPaymentAttempt())
          dispatch(
            setPaymentError(
              'La transaccion anterior termino con un error tecnico y no se puede reutilizar. Puedes intentar de nuevo.',
            ),
          )
          return
        }
        dispatch(setPaymentResult(recovered))
        navigate('/checkout/result')
      } catch (error) {
        dispatch(
          setPaymentError(
            error instanceof Error
              ? error.message
              : 'No fue posible recuperar la transaccion existente.',
          ),
        )
      } finally {
        dispatch(setPaymentSubmissionStage('idle'))
      }
    })()
  }, [dispatch, finalResult, navigate, payment.submissionStage, transactionId])

  const cardBrand = useMemo(() => detectCardBrand(cardForm.cardNumber), [cardForm.cardNumber])
  const isLoading = catalogStatus === 'loading' && !product
  const isProductUnavailable = !isLoading && !product

  function handleCustomerChange(field: keyof typeof customer, value: string) {
    dispatch(updateCheckoutCustomer({ [field]: value }))
  }

  function handleDeliveryChange(field: keyof typeof delivery, value: string) {
    dispatch(updateCheckoutDelivery({ [field]: value }))
  }

  function handleLegalFlagChange(field: keyof typeof legalFlags, value: boolean) {
    dispatch(updateLegalAcceptanceFlags({ [field]: value }))
  }

  function handleCardChange(field: keyof CardFormValues, value: string) {
    const nextValue =
      field === 'cardNumber'
        ? formatCardNumber(value)
        : field === 'expiry'
          ? formatExpiry(value)
          : field === 'cvc'
            ? sanitizeDigits(value).slice(0, 4)
            : value

    setCardForm((current) => ({ ...current, [field]: nextValue }))
  }

  function validateBeforeSummary() {
    const nextErrors = validateCheckoutDetails(customer, delivery, cardForm, legalFlags, {
      requiresPersonalDataAuthorization,
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleContinueToSummary() {
    if (!validateBeforeSummary()) return
    dispatch(clearPaymentError())
    dispatch(setCheckoutStep('summary'))
  }

  async function handleConfirmPayment() {
    if (!product || !checkoutConfig || !validateBeforeSummary()) {
      dispatch(setCheckoutStep('details'))
      return
    }

    let activeTransactionId = transactionId

    try {
      dispatch(clearPaymentError())
      dispatch(setPaymentSubmissionStage('tokenizing-card'))
      const paymentMethodToken = await tokenizeCard(cardForm, checkoutConfig.publicKey)

      if (!activeTransactionId) {
        dispatch(setPaymentSubmissionStage('creating-transaction'))
        const pending = await createPendingTransaction({ product, customer, delivery })
        activeTransactionId = pending.transactionId
        dispatch(setPaymentPending({ transactionId: activeTransactionId }))
        dispatch(
          syncPricingPreviewFromTransaction({
            ...pending.pricing,
            currency: product.currency,
          }),
        )
      }

      dispatch(setPaymentSubmissionStage('processing-payment'))
      const result = await processTransactionPayment({
        transactionId: activeTransactionId,
        paymentMethodToken,
        acceptanceToken: checkoutConfig.acceptanceToken,
        personalDataAuthToken: checkoutConfig.personalDataAuthToken,
        customerEmail: customer.email,
      })

      syncRecoveredTransaction(dispatch, result)
      dispatch(setPaymentResult(result))
      navigate('/checkout/result')
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : 'No fue posible procesar el pago.'

      if (activeTransactionId) {
        try {
          const recovered = await getTransactionStatus(activeTransactionId)
          syncRecoveredTransaction(dispatch, recovered)

          if (recovered.status === 'PENDING') {
            dispatch(setPaymentPending({ transactionId: activeTransactionId }))
            dispatch(setPaymentError(fallbackMessage))
            return
          }

          if (recovered.status === 'ERROR') {
            dispatch(clearPaymentAttempt())
            dispatch(
              setPaymentError(
                'La transaccion anterior termino con un error tecnico y no se puede reutilizar. Puedes intentar de nuevo.',
              ),
            )
            return
          }

          dispatch(setPaymentResult(recovered))
          navigate('/checkout/result')
          return
        } catch {
          // Keep the original payment error when the backend state cannot be recovered.
        }
      }

      dispatch(setPaymentError(fallbackMessage))
    } finally {
      dispatch(setPaymentSubmissionStage('idle'))
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel checkout-hero">
        <div className="hero-copy">
          <span className="eyebrow">Slice 3 en flujo real</span>
          <h1 className="page-title">Provider tokenization y procesamiento real de la transaccion</h1>
          <p className="page-copy">
            Este flujo crea la transaccion local, tokeniza la tarjeta contra el sandbox provider y procesa el pago usando el backend como fuente de verdad.
          </p>
        </div>
      </section>

      <nav className="stepper surface" aria-label="Flujo de checkout">
        <span className="stepper-item stepper-item-done">1. Producto</span>
        <span className={`stepper-item ${currentStep === 'details' ? 'stepper-item-active' : 'stepper-item-done'}`}>2. Tarjeta + entrega</span>
        <span className={`stepper-item ${currentStep === 'summary' ? 'stepper-item-active' : ''}`}>3. Resumen</span>
      </nav>

      {restoredFromStorage && currentStep === 'details' ? (
        <section className="surface banner-card">
          <div>
            <p className="status-title">Recuperamos tu progreso no sensible</p>
            <p className="status-copy">Restauramos datos de contacto, entrega y el avance visible del flujo. La tarjeta debe ingresarse de nuevo por seguridad.</p>
          </div>
          <button className="button button-secondary button-inline" onClick={() => dispatch(dismissRestoredBanner())} type="button">
            Entendido
          </button>
        </section>
      ) : null}

      {payment.error || payment.configError ? (
        <section className="surface">
          <div className="status-card status-card-error">
            <p className="status-title">Hay un problema con el flujo de pago</p>
            <p className="status-copy">{payment.error || payment.configError}</p>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <section className="surface">
          <div className="loading-block">
            <div className="loading-line loading-line-wide"></div>
            <div className="loading-card"></div>
          </div>
        </section>
      ) : null}

      {isProductUnavailable ? (
        <section className="surface">
          <div className="status-card status-card-error">
            <p className="status-title">No pudimos preparar el checkout</p>
            <p className="status-copy">{catalogError || 'Hace falta el producto actual para continuar con la compra.'}</p>
            <div className="button-row">
              <button className="button button-primary" onClick={() => void dispatch(fetchCurrentProduct())} type="button">Reintentar</button>
              <Link className="button button-secondary" to="/">Volver al producto</Link>
            </div>
          </div>
        </section>
      ) : null}

      {product ? (
        <section className="checkout-layout">
          <div className="checkout-main">
            {currentStep === 'details' ? (
              <CheckoutDetailsStep
                cardBrand={cardBrand}
                cardForm={cardForm}
                checkoutConfig={checkoutConfig}
                customer={customer}
                delivery={delivery}
                errors={errors}
                legalFlags={legalFlags}
                requiresPersonalDataAuthorization={requiresPersonalDataAuthorization}
                onCardChange={handleCardChange}
                onCustomerChange={handleCustomerChange}
                onDeliveryChange={handleDeliveryChange}
                onLegalFlagChange={handleLegalFlagChange}
              />
            ) : (
              <CheckoutSummaryStep
                cardBrand={cardBrand}
                cardForm={cardForm}
                customer={customer}
                delivery={delivery}
                onEdit={() => dispatch(setCheckoutStep('details'))}
                product={product}
              />
            )}
          </div>

          <CheckoutSidebar
            currentStep={currentStep}
            onConfirmPayment={handleConfirmPayment}
            onContinueToSummary={handleContinueToSummary}
            payment={payment}
            pricingPreview={pricingPreview}
            product={product}
            transactionId={transactionId}
          />
        </section>
      ) : null}
    </main>
  )
}

function syncRecoveredTransaction(
  dispatch: ReturnType<typeof useAppDispatch>,
  recovered: Awaited<ReturnType<typeof getTransactionStatus>>,
) {
  dispatch(syncPricingPreviewFromTransaction(recovered.pricing))
  dispatch(
    hydrateCheckoutFromTransaction({
      customer: {
        fullName: recovered.customer.fullName,
        email: recovered.customer.email,
        phone: recovered.customer.phone,
      },
      delivery: {
        addressLine1: recovered.delivery.addressLine1,
        addressLine2: recovered.delivery.addressLine2 ?? '',
        city: recovered.delivery.city,
        region: recovered.delivery.region ?? '',
        postalCode: recovered.delivery.postalCode ?? '',
        country: recovered.delivery.country,
        notes: recovered.delivery.notes ?? '',
      },
      pricingPreview: toPricingPreview(recovered.pricing),
    }),
  )
}
