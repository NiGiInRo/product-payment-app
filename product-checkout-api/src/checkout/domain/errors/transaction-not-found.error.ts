import { DomainError } from '../../../shared/domain/errors/domain.error';

export class TransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(
      'TRANSACTION_NOT_FOUND',
      `Transaction ${transactionId} was not found.`,
    );
  }
}
