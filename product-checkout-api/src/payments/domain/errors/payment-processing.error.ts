import { DomainError } from '../../../shared/domain/errors/domain.error';

export class PaymentProcessingError extends DomainError {
  constructor(reason: string | Error | Record<string, unknown> | unknown) {
    super('PAYMENT_PROCESSING_ERROR', PaymentProcessingError.toMessage(reason));
  }

  private static toMessage(reason: unknown): string {
    if (typeof reason === 'string' && reason.trim().length > 0) {
      return reason;
    }

    if (reason instanceof Error && reason.message.trim().length > 0) {
      return reason.message;
    }

    if (reason && typeof reason === 'object') {
      try {
        return JSON.stringify(reason);
      } catch {
        return 'Unexpected payment processing error.';
      }
    }

    return 'Unexpected payment processing error.';
  }
}
