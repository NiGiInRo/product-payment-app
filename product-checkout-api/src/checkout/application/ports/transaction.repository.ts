import { Transaction } from '../../domain/entities/transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Transaction): Promise<Transaction>;
  save(transaction: Transaction): Promise<Transaction>;
}
