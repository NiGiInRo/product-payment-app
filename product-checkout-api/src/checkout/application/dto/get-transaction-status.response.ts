import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

export interface GetTransactionStatusResponse {
  transactionId: string;
  status: TransactionStatus;
  statusReason?: string | null;
  pricing: {
    amountCents: number;
    baseFeeCents: number;
    deliveryFeeCents: number;
    totalCents: number;
    currency: string;
  };
  product: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
  };
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  delivery: {
    id: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region?: string | null;
    postalCode?: string | null;
    country: string;
    notes?: string | null;
  };
}
