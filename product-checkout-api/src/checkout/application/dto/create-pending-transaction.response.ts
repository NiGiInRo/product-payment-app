export interface CreatePendingTransactionResponse {
  transactionId: string;
  status: 'PENDING';
  pricing: {
    amountCents: number;
    baseFeeCents: number;
    deliveryFeeCents: number;
    totalCents: number;
  };
}
