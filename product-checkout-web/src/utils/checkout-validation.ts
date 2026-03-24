import type {
  CheckoutCustomer,
  CheckoutDelivery,
} from '../features/checkout/checkout.types'
import type { CardFormValues } from './card'
import { isValidCardNumber, isValidExpiry, sanitizeDigits } from './card'

export type CheckoutValidationErrors = Partial<
  Record<
    | 'fullName'
    | 'email'
    | 'phone'
    | 'addressLine1'
    | 'city'
    | 'country'
    | 'holderName'
    | 'cardNumber'
    | 'expiry'
    | 'cvc'
    | 'termsAccepted'
    | 'personalDataAccepted',
    string
  >
>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCheckoutDetails(
  customer: CheckoutCustomer,
  delivery: CheckoutDelivery,
  card: CardFormValues,
  acceptances: {
    termsAccepted: boolean
    personalDataAccepted: boolean
  },
) {
  const errors: CheckoutValidationErrors = {}

  if (customer.fullName.trim().length < 3) {
    errors.fullName = 'Ingresa un nombre completo valido.'
  }

  if (!EMAIL_REGEX.test(customer.email.trim())) {
    errors.email = 'Ingresa un correo electronico valido.'
  }

  if (sanitizeDigits(customer.phone).length < 7) {
    errors.phone = 'Ingresa un telefono valido.'
  }

  if (delivery.addressLine1.trim().length < 6) {
    errors.addressLine1 = 'Ingresa una direccion mas completa.'
  }

  if (delivery.city.trim().length < 2) {
    errors.city = 'Ingresa una ciudad valida.'
  }

  if (delivery.country.trim().length < 2) {
    errors.country = 'Ingresa un pais valido.'
  }

  if (card.holderName.trim().length < 3) {
    errors.holderName = 'Ingresa el nombre del titular.'
  }

  if (!isValidCardNumber(card.cardNumber)) {
    errors.cardNumber = 'Ingresa un numero de tarjeta valido.'
  }

  if (!isValidExpiry(card.expiry)) {
    errors.expiry = 'Ingresa una fecha de expiracion valida.'
  }

  const cvcLength = sanitizeDigits(card.cvc).length

  if (cvcLength < 3 || cvcLength > 4) {
    errors.cvc = 'Ingresa un CVC valido.'
  }

  if (!acceptances.termsAccepted) {
    errors.termsAccepted = 'Debes aceptar los terminos para continuar.'
  }

  if (!acceptances.personalDataAccepted) {
    errors.personalDataAccepted = 'Debes autorizar el tratamiento de datos.'
  }

  return errors
}
