export interface ProcessTransactionPaymentCommand {
  transactionId: string;
  paymentMethodToken: string;
  acceptanceToken: string;
  personalDataAuthToken?: string;
  customerEmail: string;
}
