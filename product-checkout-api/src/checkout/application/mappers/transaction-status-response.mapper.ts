import type { TransactionDetails } from '../ports/transaction.repository';
import { GetTransactionStatusResponse } from '../dto/get-transaction-status.response';

export function toTransactionStatusResponse(
  transaction: TransactionDetails,
): GetTransactionStatusResponse {
  return {
    transactionId: transaction.id,
    status: transaction.status,
    statusReason: transaction.statusReason,
    pricing: {
      amountCents: transaction.amountCents,
      baseFeeCents: transaction.baseFeeCents,
      deliveryFeeCents: transaction.deliveryFeeCents,
      totalCents: transaction.totalCents,
      currency: transaction.currency,
    },
    product: {
      id: transaction.product.id,
      name: transaction.product.name,
      description: transaction.product.description,
      imageUrl: transaction.product.imageUrl,
    },
    customer: {
      id: transaction.customer.id,
      fullName: transaction.customer.fullName,
      email: transaction.customer.email,
      phone: transaction.customer.phone,
    },
    delivery: {
      id: transaction.delivery.id,
      addressLine1: transaction.delivery.addressLine1,
      addressLine2: transaction.delivery.addressLine2,
      city: transaction.delivery.city,
      region: transaction.delivery.region,
      postalCode: transaction.delivery.postalCode,
      country: transaction.delivery.country,
      notes: transaction.delivery.notes,
    },
  };
}
