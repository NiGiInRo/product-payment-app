import { DomainError } from '../../../shared/domain/errors/domain.error';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class TransactionAlreadyProcessedError extends DomainError {
  constructor(
    transactionId: string,
    currentStatus: TransactionStatus,
  ) {
    super(
      'TRANSACTION_ALREADY_PROCESSED',
      `Transaction ${transactionId} is already in status ${currentStatus}.`,
    );
  }
}
