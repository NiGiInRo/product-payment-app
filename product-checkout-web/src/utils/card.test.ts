import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  isValidExpiry,
  maskCardNumber,
} from './card'

describe('card utilities', () => {
  it('formats card number and expiry for UI', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatExpiry('1230')).toBe('12/30')
  })

  it('detects card brands and masks card number', () => {
    expect(detectCardBrand('4242 4242 4242 4242')).toBe('visa')
    expect(detectCardBrand('5555 5555 5555 4444')).toBe('mastercard')
    expect(maskCardNumber('4242 4242 4242 4242')).toBe('**** 4242')
  })

  it('validates card number and expiry', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true)
    expect(isValidCardNumber('4242 4242 4242 4241')).toBe(false)
    expect(isValidExpiry('12/30')).toBe(true)
    expect(isValidExpiry('13/30')).toBe(false)
  })
})
