import { DomainError } from '../../../shared/domain/errors/domain.error';

export class ProductInactiveError extends DomainError {
  constructor(productId: string) {
    super(
      'PRODUCT_INACTIVE',
      `Product ${productId} is inactive and cannot be purchased.`,
    );
  }
}
