import { DomainError } from '../../../shared/domain/errors/domain.error';

export class PaymentProcessingError extends DomainError {
  constructor(reason: string) {
    super('PAYMENT_PROCESSING_ERROR', reason);
  }
}
