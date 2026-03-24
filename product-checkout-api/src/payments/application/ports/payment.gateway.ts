import { TransactionStatus } from '../../../checkout/domain/enums/transaction-status.enum';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface ProcessCardPaymentInput {
  transactionId: string;
  reference: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  paymentMethodToken: string;
  acceptanceToken: string;
  personalDataAuthToken?: string;
  signature: string;
}

export interface ProcessCardPaymentResult {
  status: TransactionStatus;
  providerTransactionId?: string | null;
  statusReason?: string | null;
  processedAt: Date;
}

export interface PaymentGateway {
  processCardPayment(
    input: ProcessCardPaymentInput,
  ): Promise<ProcessCardPaymentResult>;
}
