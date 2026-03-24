import { validateCheckoutDetails } from './checkout-validation'

describe('checkout validation', () => {
  const validCustomer = {
    fullName: 'Nicolas Infante',
    email: 'nicolas@example.com',
    phone: '3001234567',
  }

  const validDelivery = {
    addressLine1: 'Calle 123 # 45 - 67',
    addressLine2: '402',
    city: 'Bogota',
    region: 'Cundinamarca',
    postalCode: '110111',
    country: 'Colombia',
    notes: 'Porteria',
  }

  const validCard = {
    holderName: 'Nicolas Infante',
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
  }

  it('returns no errors for valid data', () => {
    expect(
      validateCheckoutDetails(validCustomer, validDelivery, validCard, {
        termsAccepted: true,
        personalDataAccepted: true,
      }, {
        requiresPersonalDataAuthorization: true,
      }),
    ).toEqual({})
  })

  it('does not require personal data acceptance when the provider config does not request it', () => {
    expect(
      validateCheckoutDetails(
        validCustomer,
        validDelivery,
        validCard,
        {
          termsAccepted: true,
          personalDataAccepted: false,
        },
        {
          requiresPersonalDataAuthorization: false,
        },
      ),
    ).toEqual({})
  })

  it('returns field errors for invalid data', () => {
    const errors = validateCheckoutDetails(
      {
        fullName: 'Ni',
        email: 'invalid-email',
        phone: '12',
      },
      {
        ...validDelivery,
        addressLine1: 'abc',
        city: 'B',
        country: 'C',
      },
      {
        holderName: 'Ni',
        cardNumber: '1111',
        expiry: '13/01',
        cvc: '1',
      },
      {
        termsAccepted: false,
        personalDataAccepted: false,
      },
      {
        requiresPersonalDataAuthorization: true,
      },
    )

    expect(errors.fullName).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.phone).toBeTruthy()
    expect(errors.addressLine1).toBeTruthy()
    expect(errors.city).toBeTruthy()
    expect(errors.country).toBeTruthy()
    expect(errors.holderName).toBeTruthy()
    expect(errors.cardNumber).toBeTruthy()
    expect(errors.expiry).toBeTruthy()
    expect(errors.cvc).toBeTruthy()
    expect(errors.termsAccepted).toBeTruthy()
    expect(errors.personalDataAccepted).toBeTruthy()
  })
})
