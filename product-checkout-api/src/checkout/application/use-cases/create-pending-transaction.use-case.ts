import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../../catalog/application/ports/product.repository';
import type { ProductRepository } from '../../../catalog/application/ports/product.repository';
import { ProductNotFoundError } from '../../../catalog/domain/errors/product-not-found.error';
import {
  CHECKOUT_PRICING_PROVIDER,
  type CheckoutPricingProvider,
} from '../ports/checkout-pricing.provider';
import { TRANSACTION_REPOSITORY } from '../ports/transaction.repository';
import type { TransactionRepository } from '../ports/transaction.repository';
import { CreatePendingTransactionCommand } from '../dto/create-pending-transaction.command';
import { CreatePendingTransactionResponse } from '../dto/create-pending-transaction.response';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { OutOfStockError } from '../../domain/errors/out-of-stock.error';
import { ProductInactiveError } from '../../../catalog/domain/errors/product-inactive.error';

@Injectable()
export class CreatePendingTransactionUseCase {
  private readonly logger = new Logger(CreatePendingTransactionUseCase.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(CHECKOUT_PRICING_PROVIDER)
    private readonly checkoutPricingProvider: CheckoutPricingProvider,
  ) {}

  async execute(
    command: CreatePendingTransactionCommand,
  ): Promise<CreatePendingTransactionResponse> {
    this.logger.log(
      `Creating pending transaction for product ${command.productId} and customer ${command.customer.email.trim().toLowerCase()}.`,
    );

    const product = await this.productRepository.findById(command.productId);

    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    if (!product.active) {
      throw new ProductInactiveError(product.id);
    }

    if (product.stock <= 0) {
      throw new OutOfStockError(product.id);
    }

    const pricing = this.checkoutPricingProvider.getPricing();
    const amountCents = product.priceCents;
    const totalCents =
      amountCents + pricing.baseFeeCents + pricing.deliveryFeeCents;

    const customer = {
      id: randomUUID(),
      fullName: command.customer.fullName.trim(),
      email: command.customer.email.trim().toLowerCase(),
      phone: command.customer.phone.trim(),
    };

    const delivery = {
      id: randomUUID(),
      addressLine1: command.delivery.addressLine1.trim(),
      addressLine2: command.delivery.addressLine2?.trim() || null,
      city: command.delivery.city.trim(),
      region: command.delivery.region?.trim() || null,
      postalCode: command.delivery.postalCode?.trim() || null,
      country: command.delivery.country.trim(),
      notes: command.delivery.notes?.trim() || null,
    };

    const transaction = await this.transactionRepository.createPendingBundle({
      customer,
      delivery,
      transaction: {
        id: randomUUID(),
        status: TransactionStatus.PENDING,
        productId: product.id,
        customerId: customer.id,
        deliveryId: delivery.id,
        amountCents,
        baseFeeCents: pricing.baseFeeCents,
        deliveryFeeCents: pricing.deliveryFeeCents,
        totalCents,
        currency: 'COP',
        providerTransactionId: null,
        statusReason: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Pending transaction ${transaction.id} created for product ${product.id}.`,
    );

    return {
      transactionId: transaction.id,
      status: 'PENDING',
      pricing: {
        amountCents: transaction.amountCents,
        baseFeeCents: transaction.baseFeeCents,
        deliveryFeeCents: transaction.deliveryFeeCents,
        totalCents: transaction.totalCents,
      },
    };
  }
}
