import type { CurrencyCode } from '../features/catalog/catalog.types'

export function formatCurrency(amountInCents: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100)
}
