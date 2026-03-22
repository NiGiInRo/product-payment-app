import { DomainError } from '../../../shared/domain/errors/domain.error';

export class WompiMerchantConfigError extends DomainError {
  constructor(message: string) {
    super('WOMPI_MERCHANT_CONFIG_ERROR', message);
  }
}
