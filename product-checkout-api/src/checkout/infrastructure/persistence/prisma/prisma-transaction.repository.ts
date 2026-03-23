import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import {
  CreatePendingTransactionBundleInput,
  SaveApprovedTransactionInput,
  TransactionDetails,
  TransactionRepository,
} from '../../../application/ports/transaction.repository';
import { Transaction } from '../../../domain/entities/transaction.entity';
import { TransactionPrismaMapper } from './mappers/transaction-prisma.mapper';
import { ProductPrismaMapper } from '../../../../catalog/infrastructure/persistence/prisma/mappers/product-prisma.mapper';
import { CustomerPrismaMapper } from './mappers/customer-prisma.mapper';
import { DeliveryPrismaMapper } from './mappers/delivery-prisma.mapper';
import { TransactionAlreadyProcessedError } from '../../../domain/errors/transaction-already-processed.error';
import { ProductInactiveError } from '../../../../catalog/domain/errors/product-inactive.error';
import { OutOfStockError } from '../../../domain/errors/out-of-stock.error';
import { TransactionNotFoundError } from '../../../domain/errors/transaction-not-found.error';
import { TransactionStatus } from '../../../domain/enums/transaction-status.enum';

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
        providerTransactionId: transaction.providerTransactionId,
        statusReason: transaction.statusReason,
        processedAt: transaction.processedAt,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });

    return TransactionPrismaMapper.toDomain(createdTransaction);
  }

  async createPendingBundle(
    input: CreatePendingTransactionBundleInput,
  ): Promise<Transaction> {
    const createdTransaction = await this.prismaService.$transaction(async (tx) => {
      await tx.customer.create({
        data: {
          id: input.customer.id,
          fullName: input.customer.fullName,
          email: input.customer.email,
          phone: input.customer.phone,
        },
      });

      await tx.delivery.create({
        data: {
          id: input.delivery.id,
          addressLine1: input.delivery.addressLine1,
          addressLine2: input.delivery.addressLine2,
          city: input.delivery.city,
          region: input.delivery.region,
          postalCode: input.delivery.postalCode,
          country: input.delivery.country,
          notes: input.delivery.notes,
        },
      });

      return tx.transaction.create({
        data: {
          id: input.transaction.id,
          status: TransactionPrismaMapper.toPrismaStatus(input.transaction.status),
          productId: input.transaction.productId,
          customerId: input.transaction.customerId,
          deliveryId: input.transaction.deliveryId,
          amountCents: input.transaction.amountCents,
          baseFeeCents: input.transaction.baseFeeCents,
          deliveryFeeCents: input.transaction.deliveryFeeCents,
          totalCents: input.transaction.totalCents,
          currency: input.transaction.currency,
          providerTransactionId: input.transaction.providerTransactionId,
          statusReason: input.transaction.statusReason,
          processedAt: input.transaction.processedAt,
          createdAt: input.transaction.createdAt,
          updatedAt: input.transaction.updatedAt,
        },
      });
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
        providerTransactionId: transaction.providerTransactionId,
        statusReason: transaction.statusReason,
        processedAt: transaction.processedAt,
      },
    });

    return TransactionPrismaMapper.toDomain(updatedTransaction);
  }

  async saveApprovedWithStockDecrement(
    input: SaveApprovedTransactionInput,
  ): Promise<Transaction> {
    const updatedTransaction = await this.prismaService.$transaction(async (tx) => {
      const updatedTransactionCount = await tx.transaction.updateMany({
        where: {
          id: input.transaction.id,
          status: TransactionPrismaMapper.toPrismaStatus(input.transaction.status)
            ? 'PENDING'
            : 'PENDING',
        },
        data: {
          status: TransactionPrismaMapper.toPrismaStatus(input.transaction.status),
          providerTransactionId: input.transaction.providerTransactionId,
          statusReason: input.transaction.statusReason,
          processedAt: input.transaction.processedAt,
        },
      });

      if (updatedTransactionCount.count !== 1) {
        const latestTransaction = await tx.transaction.findUnique({
          where: { id: input.transaction.id },
        });

        if (!latestTransaction) {
          throw new TransactionNotFoundError(input.transaction.id);
        }

        throw new TransactionAlreadyProcessedError(
          input.transaction.id,
          latestTransaction.status as TransactionStatus,
        );
      }

      const updatedProductCount = await tx.product.updateMany({
        where: {
          id: input.productId,
          active: true,
          stock: { gt: 0 },
        },
        data: {
          stock: { decrement: 1 },
        },
      });

      if (updatedProductCount.count !== 1) {
        const latestProduct = await tx.product.findUnique({
          where: { id: input.productId },
        });

        if (!latestProduct || !latestProduct.active) {
          throw new ProductInactiveError(input.productId);
        }

        throw new OutOfStockError(input.productId);
      }

      return tx.transaction.findUniqueOrThrow({
        where: { id: input.transaction.id },
      });
    });

    return TransactionPrismaMapper.toDomain(updatedTransaction);
  }
}
