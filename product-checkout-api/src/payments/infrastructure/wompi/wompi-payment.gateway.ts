import { Injectable, Inject, Logger } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import {
  PAYMENT_CONFIG_PROVIDER,
  type PaymentConfigProvider,
} from '../../application/ports/payment-config.provider';
import {
  PaymentGateway,
  ProcessCardPaymentInput,
  ProcessCardPaymentResult,
} from '../../application/ports/payment.gateway';
import { TransactionStatus } from '../../../checkout/domain/enums/transaction-status.enum';
import { PaymentProcessingError } from '../../domain/errors/payment-processing.error';

interface WompiTransactionErrorPayload {
  error?: {
    reason?: string;
    type?: string;
    messages?: string[] | Record<string, string[]>;
  };
}

interface WompiTransactionData {
  id?: string;
  status?: string;
  status_message?: string;
  finalized_at?: string | null;
}

interface WompiTransactionPayload extends WompiTransactionErrorPayload {
  data?: WompiTransactionData;
}

@Injectable()
export class WompiPaymentGateway implements PaymentGateway {
  private static readonly TERMINAL_STATUSES = new Set([
    'APPROVED',
    'DECLINED',
    'ERROR',
    'VOIDED',
  ]);
  private readonly logger = new Logger(WompiPaymentGateway.name);

  constructor(
    @Inject(PAYMENT_CONFIG_PROVIDER)
    private readonly paymentConfigProvider: PaymentConfigProvider,
  ) {}

  async processCardPayment(
    input: ProcessCardPaymentInput,
  ): Promise<ProcessCardPaymentResult> {
    const apiUrl = this.paymentConfigProvider.getWompiApiUrl();
    const privateKey = this.paymentConfigProvider.getWompiPrivateKey();

    this.logger.log(
      `Creating Wompi transaction for local transaction ${input.transactionId} and reference ${input.reference}.`,
    );

    const createResponse = await fetch(`${apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        acceptance_token: input.acceptanceToken,
        accept_personal_auth: input.personalDataAuthToken,
        amount_in_cents: input.amountCents,
        currency: input.currency,
        customer_email: input.customerEmail,
        payment_method: {
          type: 'CARD',
          token: input.paymentMethodToken,
          installments: 1,
        },
        payment_method_type: 'CARD',
        reference: input.reference,
        signature: input.signature,
      }),
    });

    const createdPayload =
      (await createResponse.json()) as WompiTransactionPayload;

    if (!createResponse.ok) {
      const message = this.extractErrorMessage(
        createdPayload,
        `Wompi payment creation failed with status ${createResponse.status}.`,
      );
      this.logger.warn(
        `Wompi rejected transaction ${input.transactionId} during creation: ${message}`,
      );
      throw new PaymentProcessingError(message);
    }

    const wompiTransactionId = createdPayload.data?.id;

    if (!wompiTransactionId) {
      throw new PaymentProcessingError(
        'Wompi did not return a transaction id for the processed payment.',
      );
    }

    this.logger.log(
      `Wompi transaction ${wompiTransactionId} created for local transaction ${input.transactionId}.`,
    );

    const finalTransaction = await this.pollFinalTransactionStatus(
      wompiTransactionId,
      createdPayload.data,
    );

    return {
      status: this.toLocalStatus(finalTransaction.status),
      wompiTransactionId,
      statusReason:
        finalTransaction.status_message ??
        'Wompi returned a final payment status without a message.',
      processedAt: this.toProcessedAt(finalTransaction.finalized_at),
    };
  }

  private async pollFinalTransactionStatus(
    wompiTransactionId: string,
    initialTransaction?: WompiTransactionData,
  ): Promise<WompiTransactionData> {
    const apiUrl = this.paymentConfigProvider.getWompiApiUrl();
    const publicKey = this.paymentConfigProvider.getWompiPublicKey();
    let latestTransaction = initialTransaction;

    if (latestTransaction?.status && this.isTerminalStatus(latestTransaction.status)) {
      return latestTransaction;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${apiUrl}/transactions/${wompiTransactionId}`, {
        headers: {
          Authorization: `Bearer ${publicKey}`,
        },
      });

      const payload = (await response.json()) as WompiTransactionPayload;

      if (!response.ok) {
        const message = this.extractErrorMessage(
          payload,
          `Wompi transaction lookup failed with status ${response.status}.`,
        );
        this.logger.warn(
          `Wompi lookup failed for transaction ${wompiTransactionId}: ${message}`,
        );
        throw new PaymentProcessingError(message);
      }

      latestTransaction = payload.data;

      if (!latestTransaction?.status) {
        throw new PaymentProcessingError(
          'Wompi transaction lookup did not return a valid payment status.',
        );
      }

      if (this.isTerminalStatus(latestTransaction.status)) {
        this.logger.log(
          `Wompi transaction ${wompiTransactionId} reached terminal status ${latestTransaction.status}.`,
        );
        return latestTransaction;
      }

      await delay(750);
    }

    return {
      id: wompiTransactionId,
      status: 'ERROR',
      status_message:
        'Wompi transaction did not reach a terminal status within the polling window.',
      finalized_at: new Date().toISOString(),
    };
  }

  private isTerminalStatus(status: string): boolean {
    return WompiPaymentGateway.TERMINAL_STATUSES.has(status);
  }

  private toLocalStatus(status?: string): TransactionStatus {
    switch (status) {
      case 'APPROVED':
        return TransactionStatus.APPROVED;
      case 'DECLINED':
        return TransactionStatus.DECLINED;
      case 'ERROR':
        return TransactionStatus.ERROR;
      case 'VOIDED':
        return TransactionStatus.ERROR;
      default:
        throw new PaymentProcessingError(
          `Wompi returned an unsupported final status: ${status ?? 'undefined'}.`,
        );
    }
  }

  private toProcessedAt(finalizedAt?: string | null): Date {
    if (!finalizedAt) {
      return new Date();
    }

    const parsedDate = new Date(finalizedAt);

    if (Number.isNaN(parsedDate.getTime())) {
      return new Date();
    }

    return parsedDate;
  }

  private extractErrorMessage(
    payload: WompiTransactionErrorPayload,
    fallback: string,
  ): string {
    const reason = payload.error?.reason;

    if (typeof reason === 'string' && reason.trim().length > 0) {
      return reason;
    }

    const messages = payload.error?.messages;

    const flattened = this.flattenMessages(messages);

    if (flattened.length > 0) {
      return flattened.join(', ');
    }

    return fallback;
  }

  private flattenMessages(value: unknown): string[] {
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => this.flattenMessages(item));
    }

    if (value && typeof value === 'object') {
      return Object.values(value).flatMap((item) => this.flattenMessages(item));
    }

    return [];
  }
}
