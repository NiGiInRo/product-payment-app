export type CardBrand = 'visa' | 'mastercard' | 'unknown'

export type CardFormValues = {
  holderName: string
  cardNumber: string
  expiry: string
  cvc: string
}

const ONLY_DIGITS_REGEX = /\D/g

export function sanitizeDigits(value: string) {
  return value.replace(ONLY_DIGITS_REGEX, '')
}

export function formatCardNumber(value: string) {
  return sanitizeDigits(value)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export function formatExpiry(value: string) {
  const digits = sanitizeDigits(value).slice(0, 4)

  if (digits.length < 3) {
    return digits
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = sanitizeDigits(cardNumber)

  if (digits.startsWith('4')) {
    return 'visa'
  }

  const firstTwoDigits = Number(digits.slice(0, 2))
  const firstFourDigits = Number(digits.slice(0, 4))

  if (
    (firstTwoDigits >= 51 && firstTwoDigits <= 55) ||
    (firstFourDigits >= 2221 && firstFourDigits <= 2720)
  ) {
    return 'mastercard'
  }

  return 'unknown'
}

export function getBrandLabel(cardBrand: CardBrand) {
  if (cardBrand === 'visa') {
    return 'Visa'
  }

  if (cardBrand === 'mastercard') {
    return 'Mastercard'
  }

  return 'Tarjeta'
}

export function maskCardNumber(cardNumber: string) {
  const digits = sanitizeDigits(cardNumber)

  if (digits.length < 4) {
    return 'Sin capturar'
  }

  return `**** ${digits.slice(-4)}`
}

export function isValidCardNumber(cardNumber: string) {
  const digits = sanitizeDigits(cardNumber)

  if (digits.length < 13 || digits.length > 16) {
    return false
  }

  let sum = 0
  let shouldDouble = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])

    if (shouldDouble) {
      digit *= 2

      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

export function isValidExpiry(expiry: string) {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/)

  if (!match) {
    return false
  }

  const month = Number(match[1])
  const year = Number(`20${match[2]}`)

  if (month < 1 || month > 12) {
    return false
  }

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  return year > currentYear || (year === currentYear && month >= currentMonth)
}
