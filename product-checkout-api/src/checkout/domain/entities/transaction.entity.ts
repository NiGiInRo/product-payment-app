import { TransactionStatus } from '../enums/transaction-status.enum';

export interface Transaction {
  id: string;
  status: TransactionStatus;
  productId: string;
  customerId: string;
  deliveryId: string;
  amountCents: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  currency: string;
  providerTransactionId?: string | null;
  statusReason?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
