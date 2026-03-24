import checkoutReducer, {
  hydrateCheckoutFromTransaction,
  initialCheckoutState,
  resetCheckoutState,
  setCheckoutStep,
  syncPricingPreviewFromProduct,
  syncPricingPreviewFromTransaction,
  updateCheckoutCustomer,
  updateCheckoutDelivery,
  updateLegalAcceptanceFlags,
} from './checkout.slice'

describe('checkout reducer', () => {
  it('updates customer and delivery data', () => {
    const withCustomer = checkoutReducer(
      initialCheckoutState,
      updateCheckoutCustomer({
        fullName: 'Nicolas',
        email: 'nicolas@example.com',
      }),
    )

    const withDelivery = checkoutReducer(
      withCustomer,
      updateCheckoutDelivery({
        addressLine1: 'Calle 123',
        city: 'Bogota',
      }),
    )

    expect(withDelivery.customer.fullName).toBe('Nicolas')
    expect(withDelivery.customer.email).toBe('nicolas@example.com')
    expect(withDelivery.delivery.addressLine1).toBe('Calle 123')
    expect(withDelivery.delivery.city).toBe('Bogota')
  })

  it('moves to summary and stores legal flags', () => {
    const nextState = checkoutReducer(
      initialCheckoutState,
      updateLegalAcceptanceFlags({
        termsAccepted: true,
        personalDataAccepted: true,
      }),
    )

    const summaryState = checkoutReducer(nextState, setCheckoutStep('summary'))

    expect(summaryState.currentStep).toBe('summary')
    expect(summaryState.legalAcceptanceFlags.termsAccepted).toBe(true)
    expect(summaryState.legalAcceptanceFlags.personalDataAccepted).toBe(true)
  })

  it('syncs estimated pricing from product and frozen pricing from transaction', () => {
    const estimatedState = checkoutReducer(
      initialCheckoutState,
      syncPricingPreviewFromProduct({
        id: 'p1',
        name: 'Auriculares',
        description: 'desc',
        priceCents: 12990000,
        stock: 10,
        imageUrl: 'https://example.com/image.jpg',
        currency: 'COP',
      }),
    )

    const frozenState = checkoutReducer(
      estimatedState,
      syncPricingPreviewFromTransaction({
        amountCents: 12990000,
        baseFeeCents: 5000,
        deliveryFeeCents: 8000,
        totalCents: 13003000,
        currency: 'COP',
      }),
    )

    expect(estimatedState.pricingPreview.isEstimated).toBe(true)
    expect(frozenState.pricingPreview.isEstimated).toBe(false)
    expect(frozenState.pricingPreview.totalCents).toBe(13003000)
  })

  it('hydrates from a recovered transaction and resets cleanly', () => {
    const hydrated = checkoutReducer(
      initialCheckoutState,
      hydrateCheckoutFromTransaction({
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
        pricingPreview: {
          amountCents: 12990000,
          baseFeeCents: 5000,
          deliveryFeeCents: 8000,
          totalCents: 13003000,
          currency: 'COP',
          isEstimated: false,
        },
      }),
    )

    const resetState = checkoutReducer(hydrated, resetCheckoutState())

    expect(hydrated.customer.fullName).toBe('Nicolas')
    expect(hydrated.pricingPreview.isEstimated).toBe(false)
    expect(resetState).toEqual(initialCheckoutState)
  })
})
