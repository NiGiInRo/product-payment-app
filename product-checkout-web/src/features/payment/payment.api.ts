import { apiRequest } from '../../services/api-client'
import type { CurrentProduct } from '../catalog/catalog.types'
import type { CheckoutCustomer, CheckoutDelivery } from '../checkout/checkout.types'
import type { CardFormValues } from '../../utils/card'
import { sanitizeDigits } from '../../utils/card'
import type {
  CheckoutConfig,
  CreatePendingTransactionResponse,
  TransactionResult,
} from './payment.types'

const DEFAULT_PAYMENT_PROVIDER_API_URL = 'https://api-sandbox.co.uat.wompi.dev/v1'

const PAYMENT_PROVIDER_API_URL = (
  import.meta.env.VITE_PAYMENT_PROVIDER_API_URL || DEFAULT_PAYMENT_PROVIDER_API_URL
).replace(/\/$/, '')

type ProviderCardTokenResponse = {
  data?: {
    id?: string
    status?: string
  }
  error?: {
    reason?: string
    messages?: string[] | Record<string, string[]>
  }
}

export class PaymentTokenizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentTokenizationError'
  }
}

export function getCheckoutConfig() {
  return apiRequest<CheckoutConfig>('/checkout/config')
}

export function createPendingTransaction(input: {
  product: CurrentProduct
  customer: CheckoutCustomer
  delivery: CheckoutDelivery
}) {
  return apiRequest<CreatePendingTransactionResponse>('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      productId: input.product.id,
      customer: input.customer,
      delivery: input.delivery,
    }),
  })
}

export function processTransactionPayment(input: {
  transactionId: string
  paymentMethodToken: string
  acceptanceToken: string
  personalDataAuthToken?: string
  customerEmail: string
}) {
  return apiRequest<TransactionResult>(`/transactions/${input.transactionId}/process-payment`, {
    method: 'POST',
    body: JSON.stringify({
      paymentMethodToken: input.paymentMethodToken,
      acceptanceToken: input.acceptanceToken,
      personalDataAuthToken: input.personalDataAuthToken,
      customerEmail: input.customerEmail,
    }),
  })
}

export function getTransactionStatus(transactionId: string) {
  return apiRequest<TransactionResult>(`/transactions/${transactionId}`)
}

export async function tokenizeCard(
  card: CardFormValues,
  publicKey: string,
): Promise<string> {
  const digits = sanitizeDigits(card.cardNumber)
  const [expMonth = '', expYear = ''] = card.expiry.split('/')

  const response = await fetch(`${PAYMENT_PROVIDER_API_URL}/tokens/cards`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: digits,
      cvc: sanitizeDigits(card.cvc),
      exp_month: expMonth,
      exp_year: expYear,
      card_holder: card.holderName.trim(),
    }),
  })

  const payload = (await response.json()) as ProviderCardTokenResponse

  if (!response.ok || !payload.data?.id) {
    throw new PaymentTokenizationError(
      extractTokenizationError(
        payload,
        `La tokenizacion de la tarjeta fallo con estado ${response.status}.`,
      ),
    )
  }

  return payload.data.id
}

function extractTokenizationError(
  payload: ProviderCardTokenResponse,
  fallback: string,
): string {
  const reason = payload.error?.reason

  if (typeof reason === 'string' && reason.trim().length > 0) {
    return reason
  }

  const messages = payload.error?.messages

  if (Array.isArray(messages) && messages.length > 0) {
    return messages.join(', ')
  }

  if (messages && typeof messages === 'object') {
    const flattenedMessages = Object.values(messages).flat()

    if (flattenedMessages.length > 0) {
      return flattenedMessages.join(', ')
    }
  }

  return fallback
}
