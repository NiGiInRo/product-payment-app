import { DomainError } from '../../../shared/domain/errors/domain.error';

export class ProductNotFoundError extends DomainError {
  constructor(productId?: string) {
    super(
      'PRODUCT_NOT_FOUND',
      productId
        ? `Product with id ${productId} was not found.`
        : 'No active product was found.',
    );
  }
}
