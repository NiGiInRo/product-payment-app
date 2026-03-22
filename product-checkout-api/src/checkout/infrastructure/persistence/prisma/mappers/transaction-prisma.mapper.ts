import {
  Transaction as PrismaTransaction,
  TransactionStatus as PrismaTransactionStatus,
} from '../../../../../generated/prisma/client.js';
import { Transaction } from '../../../../domain/entities/transaction.entity';
import { TransactionStatus } from '../../../../domain/enums/transaction-status.enum';

export class TransactionPrismaMapper {
  static toDomain(prismaTransaction: PrismaTransaction): Transaction {
    return {
      id: prismaTransaction.id,
      status: prismaTransaction.status as TransactionStatus,
      productId: prismaTransaction.productId,
      customerId: prismaTransaction.customerId,
      deliveryId: prismaTransaction.deliveryId,
      amountCents: prismaTransaction.amountCents,
      baseFeeCents: prismaTransaction.baseFeeCents,
      deliveryFeeCents: prismaTransaction.deliveryFeeCents,
      totalCents: prismaTransaction.totalCents,
      currency: prismaTransaction.currency,
      wompiTransactionId: prismaTransaction.wompiTransactionId,
      statusReason: prismaTransaction.statusReason,
      processedAt: prismaTransaction.processedAt,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
    };
  }

  static toPrismaStatus(status: TransactionStatus): PrismaTransactionStatus {
    return status as PrismaTransactionStatus;
  }
}
