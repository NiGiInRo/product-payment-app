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

interface ProviderTransactionErrorPayload {
  error?: {
    reason?: string;
    type?: string;
    messages?: string[] | Record<string, string[]>;
  };
}

interface ProviderTransactionData {
  id?: string;
  status?: string;
  status_message?: string;
  finalized_at?: string | null;
}

interface ProviderTransactionPayload extends ProviderTransactionErrorPayload {
  data?: ProviderTransactionData;
}

@Injectable()
export class ProviderPaymentGateway implements PaymentGateway {
  private static readonly TERMINAL_STATUSES = new Set([
    'APPROVED',
    'DECLINED',
    'ERROR',
    'VOIDED',
  ]);
  private readonly logger = new Logger(ProviderPaymentGateway.name);

  constructor(
    @Inject(PAYMENT_CONFIG_PROVIDER)
    private readonly paymentConfigProvider: PaymentConfigProvider,
  ) {}

  async processCardPayment(
    input: ProcessCardPaymentInput,
  ): Promise<ProcessCardPaymentResult> {
    const apiUrl = this.paymentConfigProvider.getApiUrl();
    const privateKey = this.paymentConfigProvider.getPrivateKey();

    this.logger.log(
      `Creating provider transaction for local transaction ${input.transactionId} and reference ${input.reference}.`,
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
      (await createResponse.json()) as ProviderTransactionPayload;

    if (!createResponse.ok) {
      const message = this.extractErrorMessage(
        createdPayload,
        `Payment provider creation failed with status ${createResponse.status}.`,
      );
      this.logger.warn(
        `Payment provider rejected transaction ${input.transactionId} during creation: ${message}`,
      );
      throw new PaymentProcessingError(message);
    }

    const providerTransactionId = createdPayload.data?.id;

    if (!providerTransactionId) {
      throw new PaymentProcessingError(
        'Payment provider did not return a transaction id for the processed payment.',
      );
    }

    this.logger.log(
      `Provider transaction ${providerTransactionId} created for local transaction ${input.transactionId}.`,
    );

    const finalTransaction = await this.pollFinalTransactionStatus(
      providerTransactionId,
      createdPayload.data,
    );

    return {
      status: this.toLocalStatus(finalTransaction.status),
      providerTransactionId,
      statusReason:
        finalTransaction.status_message ??
        'Payment provider returned a final payment status without a message.',
      processedAt: this.toProcessedAt(finalTransaction.finalized_at),
    };
  }

  private async pollFinalTransactionStatus(
    providerTransactionId: string,
    initialTransaction?: ProviderTransactionData,
  ): Promise<ProviderTransactionData> {
    const apiUrl = this.paymentConfigProvider.getApiUrl();
    const publicKey = this.paymentConfigProvider.getPublicKey();
    let latestTransaction = initialTransaction;

    if (latestTransaction?.status && this.isTerminalStatus(latestTransaction.status)) {
      return latestTransaction;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${apiUrl}/transactions/${providerTransactionId}`, {
        headers: {
          Authorization: `Bearer ${publicKey}`,
        },
      });

      const payload = (await response.json()) as ProviderTransactionPayload;

      if (!response.ok) {
        const message = this.extractErrorMessage(
          payload,
          `Payment provider transaction lookup failed with status ${response.status}.`,
        );
        this.logger.warn(
          `Payment provider lookup failed for transaction ${providerTransactionId}: ${message}`,
        );
        throw new PaymentProcessingError(message);
      }

      latestTransaction = payload.data;

      if (!latestTransaction?.status) {
        throw new PaymentProcessingError(
          'Payment provider transaction lookup did not return a valid payment status.',
        );
      }

      if (this.isTerminalStatus(latestTransaction.status)) {
        this.logger.log(
          `Provider transaction ${providerTransactionId} reached terminal status ${latestTransaction.status}.`,
        );
        return latestTransaction;
      }

      await delay(750);
    }

    return {
      id: providerTransactionId,
      status: 'ERROR',
      status_message:
        'Payment provider transaction did not reach a terminal status within the polling window.',
      finalized_at: new Date().toISOString(),
    };
  }

  private isTerminalStatus(status: string): boolean {
    return ProviderPaymentGateway.TERMINAL_STATUSES.has(status);
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
          `Payment provider returned an unsupported final status: ${status ?? 'undefined'}.`,
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
    payload: ProviderTransactionErrorPayload,
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
