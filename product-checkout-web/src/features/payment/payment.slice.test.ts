import paymentReducer, {
  clearPaymentAttempt,
  clearPaymentError,
  initialPaymentState,
  resetPaymentState,
  setCheckoutConfig,
  setPaymentError,
  setPaymentPending,
  setPaymentResult,
  setPaymentSubmissionStage,
  startCheckoutConfigLoad,
} from './payment.slice'

describe('payment reducer', () => {
  it('stores checkout config and loading state', () => {
    const loadingState = paymentReducer(initialPaymentState, startCheckoutConfigLoad())
    const loadedState = paymentReducer(
      loadingState,
      setCheckoutConfig({
        publicKey: 'pub_stagtest_x',
        acceptanceToken: 'acceptance-token',
        personalDataAuthToken: 'personal-token',
        legalLinks: {
          acceptance: 'https://example.com/acceptance',
          personalDataAuthorization: 'https://example.com/privacy',
        },
      }),
    )

    expect(loadingState.configStatus).toBe('loading')
    expect(loadedState.configStatus).toBe('succeeded')
    expect(loadedState.checkoutConfig?.publicKey).toBe('pub_stagtest_x')
  })

  it('tracks pending and final result state', () => {
    const pendingState = paymentReducer(
      initialPaymentState,
      setPaymentPending({
        transactionId: 'txn-1',
      }),
    )

    const finalState = paymentReducer(
      pendingState,
      setPaymentResult({
        transactionId: 'txn-1',
        status: 'DECLINED',
        statusReason: 'Fondos insuficientes',
        pricing: {
          amountCents: 12990000,
          baseFeeCents: 5000,
          deliveryFeeCents: 8000,
          totalCents: 13003000,
          currency: 'COP',
        },
        product: {
          id: 'p1',
          name: 'Auriculares',
          description: 'desc',
          imageUrl: 'https://example.com/image.jpg',
        },
        customer: {
          id: 'c1',
          fullName: 'Nicolas',
          email: 'nicolas@example.com',
          phone: '3001234567',
        },
        delivery: {
          id: 'd1',
          addressLine1: 'Calle 123',
          city: 'Bogota',
          country: 'Colombia',
          addressLine2: '402',
          region: 'Cundinamarca',
          postalCode: '110111',
          notes: 'Porteria',
        },
      }),
    )

    expect(pendingState.status).toBe('PENDING')
    expect(finalState.status).toBe('DECLINED')
    expect(finalState.finalResult?.statusReason).toBe('Fondos insuficientes')
  })

  it('stores and clears errors, then resets all payment state', () => {
    const withStage = paymentReducer(
      initialPaymentState,
      setPaymentSubmissionStage('processing-payment'),
    )
    const withError = paymentReducer(withStage, setPaymentError('Network error'))
    const cleared = paymentReducer(withError, clearPaymentError())
    const reset = paymentReducer(cleared, resetPaymentState())

    expect(withError.error).toBe('Network error')
    expect(cleared.error).toBeNull()
    expect(reset).toEqual(initialPaymentState)
  })

  it('clears a dead transaction attempt without losing checkout config', () => {
    const withConfig = paymentReducer(
      initialPaymentState,
      setCheckoutConfig({
        publicKey: 'pub_stagtest_x',
        acceptanceToken: 'acceptance-token',
        legalLinks: {
          acceptance: 'https://example.com/acceptance',
        },
      }),
    )

    const withPending = paymentReducer(
      withConfig,
      setPaymentPending({
        transactionId: 'txn-1',
      }),
    )

    const clearedAttempt = paymentReducer(withPending, clearPaymentAttempt())

    expect(clearedAttempt.transactionId).toBeNull()
    expect(clearedAttempt.status).toBe('idle')
    expect(clearedAttempt.finalResult).toBeNull()
    expect(clearedAttempt.checkoutConfig?.publicKey).toBe('pub_stagtest_x')
  })
})
