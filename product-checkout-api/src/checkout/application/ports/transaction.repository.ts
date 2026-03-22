import { Transaction } from '../../domain/entities/transaction.entity';
import { Product } from '../../../catalog/domain/entities/product.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Delivery } from '../../domain/entities/delivery.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionDetails extends Transaction {
  product: Product;
  customer: Customer;
  delivery: Delivery;
}

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findDetailsById(id: string): Promise<TransactionDetails | null>;
  create(transaction: Transaction): Promise<Transaction>;
  save(transaction: Transaction): Promise<Transaction>;
}
