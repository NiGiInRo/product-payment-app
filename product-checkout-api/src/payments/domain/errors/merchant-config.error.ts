import { DomainError } from '../../../shared/domain/errors/domain.error';

export class MerchantConfigError extends DomainError {
  constructor(message: string) {
    super('MERCHANT_CONFIG_ERROR', message);
  }
}
