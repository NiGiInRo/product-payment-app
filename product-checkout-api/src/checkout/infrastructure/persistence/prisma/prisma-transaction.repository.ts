import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import {
  TransactionDetails,
  TransactionRepository,
} from '../../../application/ports/transaction.repository';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { TransactionPrismaMapper } from './mappers/transaction-prisma.mapper';
import { ProductPrismaMapper } from '../../../../catalog/infrastructure/persistence/prisma/mappers/product-prisma.mapper';
import { CustomerPrismaMapper } from './mappers/customer-prisma.mapper';
import { DeliveryPrismaMapper } from './mappers/delivery-prisma.mapper';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
    });

    return transaction ? TransactionPrismaMapper.toDomain(transaction) : null;
  }

  async findDetailsById(id: string): Promise<TransactionDetails | null> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        delivery: true,
      },
    });

    if (!transaction) {
      return null;
    }

    return {
      ...TransactionPrismaMapper.toDomain(transaction),
      product: ProductPrismaMapper.toDomain(transaction.product),
      customer: CustomerPrismaMapper.toDomain(transaction.customer),
      delivery: DeliveryPrismaMapper.toDomain(transaction.delivery),
    };
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const createdTransaction = await this.prismaService.transaction.create({
      data: {
        id: transaction.id,
        status: TransactionPrismaMapper.toPrismaStatus(transaction.status),
        productId: transaction.productId,
        customerId: transaction.customerId,
        deliveryId: transaction.deliveryId,
        amountCents: transaction.amountCents,
        baseFeeCents: transaction.baseFeeCents,
        deliveryFeeCents: transaction.deliveryFeeCents,
        totalCents: transaction.totalCents,
        currency: transaction.currency,
        wompiTransactionId: transaction.wompiTransactionId,
        statusReason: transaction.statusReason,
        processedAt: transaction.processedAt,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });

    return TransactionPrismaMapper.toDomain(createdTransaction);
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const updatedTransaction = await this.prismaService.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionPrismaMapper.toPrismaStatus(transaction.status),
        productId: transaction.productId,
        customerId: transaction.customerId,
        deliveryId: transaction.deliveryId,
        amountCents: transaction.amountCents,
        baseFeeCents: transaction.baseFeeCents,
        deliveryFeeCents: transaction.deliveryFeeCents,
        totalCents: transaction.totalCents,
        currency: transaction.currency,
        wompiTransactionId: transaction.wompiTransactionId,
        statusReason: transaction.statusReason,
        processedAt: transaction.processedAt,
      },
    });

    return TransactionPrismaMapper.toDomain(updatedTransaction);
  }
}
