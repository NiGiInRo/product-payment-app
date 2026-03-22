import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../../catalog/application/ports/product.repository';
import type { ProductRepository } from '../../../catalog/application/ports/product.repository';
import { ProductInactiveError } from '../../../catalog/domain/errors/product-inactive.error';
import { PAYMENT_GATEWAY, type PaymentGateway } from '../../../payments/application/ports/payment.gateway';
import {
  PAYMENT_CONFIG_PROVIDER,
  type PaymentConfigProvider,
} from '../../../payments/application/ports/payment-config.provider';
import { PaymentProcessingError } from '../../../payments/domain/errors/payment-processing.error';
import { ProcessTransactionPaymentCommand } from '../dto/process-transaction-payment.command';
import { GetTransactionStatusResponse } from '../dto/get-transaction-status.response';
import { TRANSACTION_REPOSITORY } from '../ports/transaction.repository';
import type { TransactionDetails, TransactionRepository } from '../ports/transaction.repository';
import { OutOfStockError } from '../../domain/errors/out-of-stock.error';
import { TransactionAlreadyProcessedError } from '../../domain/errors/transaction-already-processed.error';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { toTransactionStatusResponse } from '../mappers/transaction-status-response.mapper';

@Injectable()
export class ProcessTransactionPaymentUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
    @Inject(PAYMENT_CONFIG_PROVIDER)
    private readonly paymentConfigProvider: PaymentConfigProvider,
  ) {}

  async execute(
    command: ProcessTransactionPaymentCommand,
  ): Promise<GetTransactionStatusResponse> {
    const transaction =
      await this.transactionRepository.findDetailsById(command.transactionId);

    if (!transaction) {
      throw new TransactionNotFoundError(command.transactionId);
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new TransactionAlreadyProcessedError(
        transaction.id,
        transaction.status,
      );
    }

    if (!transaction.product.active) {
      throw new ProductInactiveError(transaction.product.id);
    }

    if (transaction.product.stock <= 0) {
      throw new OutOfStockError(transaction.product.id);
    }

    const customerEmail = command.customerEmail.trim().toLowerCase();
    const paymentResult = await this.processExternalPayment(
      transaction,
      customerEmail,
      command,
    );

    const updatedTransaction = await this.transactionRepository.save({
      ...transaction,
      status: paymentResult.status,
      wompiTransactionId: paymentResult.wompiTransactionId ?? null,
      statusReason: paymentResult.statusReason ?? null,
      processedAt: paymentResult.processedAt,
    });

    if (updatedTransaction.status === TransactionStatus.APPROVED) {
      await this.productRepository.save({
        ...transaction.product,
        stock: transaction.product.stock - 1,
      });
    }

    return toTransactionStatusResponse({
      ...transaction,
      ...updatedTransaction,
    });
  }

  private async processExternalPayment(
    transaction: TransactionDetails,
    customerEmail: string,
    command: ProcessTransactionPaymentCommand,
  ) {
    try {
      return await this.paymentGateway.processCardPayment({
        transactionId: transaction.id,
        reference: this.buildReference(transaction.id),
        amountCents: transaction.totalCents,
        currency: transaction.currency,
        customerEmail,
        paymentMethodToken: command.paymentMethodToken.trim(),
        acceptanceToken: command.acceptanceToken.trim(),
        personalDataAuthToken: command.personalDataAuthToken?.trim(),
        signature: this.buildIntegritySignature(
          transaction.id,
          transaction.totalCents,
          transaction.currency,
        ),
      });
    } catch (error: unknown) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Unexpected payment processing error.';

      await this.transactionRepository.save({
        ...transaction,
        status: TransactionStatus.ERROR,
        statusReason: reason,
        processedAt: new Date(),
      });

      if (error instanceof PaymentProcessingError) {
        throw error;
      }

      throw new PaymentProcessingError(reason);
    }
  }

  private buildReference(transactionId: string): string {
    return `txn_${transactionId}`;
  }

  private buildIntegritySignature(
    transactionId: string,
    amountCents: number,
    currency: string,
  ): string {
    const integrityKey = this.paymentConfigProvider.getWompiIntegrityKey();
    const reference = this.buildReference(transactionId);

    return createHash('sha256')
      .update(`${reference}${amountCents}${currency}${integrityKey}`)
      .digest('hex');
  }
}
