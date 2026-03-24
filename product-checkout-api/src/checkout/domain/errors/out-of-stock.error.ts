import { DomainError } from '../../../shared/domain/errors/domain.error';

export class OutOfStockError extends DomainError {
  constructor(productId: string) {
    super(
      'OUT_OF_STOCK',
      `Product ${productId} is out of stock for this transaction.`,
    );
  }
}
