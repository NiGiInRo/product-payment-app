import { Injectable, Inject } from '@nestjs/common';
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

  constructor(
    @Inject(PAYMENT_CONFIG_PROVIDER)
    private readonly paymentConfigProvider: PaymentConfigProvider,
  ) {}

  async processCardPayment(
    input: ProcessCardPaymentInput,
  ): Promise<ProcessCardPaymentResult> {
    const apiUrl = this.paymentConfigProvider.getWompiApiUrl();
    const privateKey = this.paymentConfigProvider.getWompiPrivateKey();

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
      throw new PaymentProcessingError(
        this.extractErrorMessage(
          createdPayload,
          `Wompi payment creation failed with status ${createResponse.status}.`,
        ),
      );
    }

    const wompiTransactionId = createdPayload.data?.id;

    if (!wompiTransactionId) {
      throw new PaymentProcessingError(
        'Wompi did not return a transaction id for the processed payment.',
      );
    }

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
        throw new PaymentProcessingError(
          this.extractErrorMessage(
            payload,
            `Wompi transaction lookup failed with status ${response.status}.`,
          ),
        );
      }

      latestTransaction = payload.data;

      if (!latestTransaction?.status) {
        throw new PaymentProcessingError(
          'Wompi transaction lookup did not return a valid payment status.',
        );
      }

      if (this.isTerminalStatus(latestTransaction.status)) {
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

    if (reason) {
      return reason;
    }

    const messages = payload.error?.messages;

    if (Array.isArray(messages) && messages.length > 0) {
      return messages.join(', ');
    }

    if (messages && typeof messages === 'object') {
      const flattened = Object.values(messages).flat();

      if (flattened.length > 0) {
        return flattened.join(', ');
      }
    }

    return fallback;
  }
}
