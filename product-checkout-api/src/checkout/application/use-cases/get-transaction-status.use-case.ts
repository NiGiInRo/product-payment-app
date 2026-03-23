import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_REPOSITORY } from '../ports/transaction.repository';
import type {
  TransactionRepository,
} from '../ports/transaction.repository';
import { GetTransactionStatusResponse } from '../dto/get-transaction-status.response';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import { toTransactionStatusResponse } from '../mappers/transaction-status-response.mapper';

@Injectable()
export class GetTransactionStatusUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(transactionId: string): Promise<GetTransactionStatusResponse> {
    const transaction =
      await this.transactionRepository.findDetailsById(transactionId);

    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }

    return toTransactionStatusResponse(transaction);
  }
}
