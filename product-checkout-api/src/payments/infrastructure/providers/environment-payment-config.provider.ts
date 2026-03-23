import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentConfigProvider } from '../../application/ports/payment-config.provider';
import { PaymentProcessingError } from '../../domain/errors/payment-processing.error';

@Injectable()
export class EnvironmentPaymentConfigProvider implements PaymentConfigProvider {
  constructor(private readonly configService: ConfigService) {}

  getApiUrl(): string {
    return this.getRequiredValue(
      ['PAYMENT_PROVIDER_API_URL', 'WOMPI_API_URL'],
      'PAYMENT_PROVIDER_API_URL is not configured for payment processing.',
    );
  }

  getPublicKey(): string {
    return this.getRequiredValue(
      ['PAYMENT_PROVIDER_PUBLIC_KEY', 'WOMPI_PUBLIC_KEY'],
      'PAYMENT_PROVIDER_PUBLIC_KEY is not configured for payment processing.',
    );
  }

  getPrivateKey(): string {
    return this.getRequiredValue(
      ['PAYMENT_PROVIDER_PRIVATE_KEY', 'WOMPI_PRIVATE_KEY'],
      'PAYMENT_PROVIDER_PRIVATE_KEY is not configured for payment processing.',
    );
  }

  getIntegrityKey(): string {
    return this.getRequiredValue(
      ['PAYMENT_PROVIDER_INTEGRITY_KEY', 'WOMPI_INTEGRITY_KEY'],
      'PAYMENT_PROVIDER_INTEGRITY_KEY is not configured for payment processing.',
    );
  }

  private getRequiredValue(keys: string[], message: string): string {
    const value = keys
      .map((key) => this.configService.get<string>(key))
      .find((candidate) => candidate && candidate.trim().length > 0);

    if (!value || value.includes('placeholder')) {
      throw new PaymentProcessingError(message);
    }

    return value;
  }
}
