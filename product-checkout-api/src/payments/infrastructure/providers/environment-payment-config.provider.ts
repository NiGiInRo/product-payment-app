import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentConfigProvider } from '../../application/ports/payment-config.provider';
import { PaymentProcessingError } from '../../domain/errors/payment-processing.error';

@Injectable()
export class EnvironmentPaymentConfigProvider implements PaymentConfigProvider {
  constructor(private readonly configService: ConfigService) {}

  getWompiApiUrl(): string {
    return this.getRequiredValue(
      'WOMPI_API_URL',
      'WOMPI_API_URL is not configured for payment processing.',
    );
  }

  getWompiPublicKey(): string {
    return this.getRequiredValue(
      'WOMPI_PUBLIC_KEY',
      'WOMPI_PUBLIC_KEY is not configured for payment processing.',
    );
  }

  getWompiPrivateKey(): string {
    return this.getRequiredValue(
      'WOMPI_PRIVATE_KEY',
      'WOMPI_PRIVATE_KEY is not configured for payment processing.',
    );
  }

  getWompiIntegrityKey(): string {
    return this.getRequiredValue(
      'WOMPI_INTEGRITY_KEY',
      'WOMPI_INTEGRITY_KEY is not configured for payment processing.',
    );
  }

  private getRequiredValue(key: string, message: string): string {
    const value = this.configService.get<string>(key);

    if (!value || value.includes('placeholder')) {
      throw new PaymentProcessingError(message);
    }

    return value;
  }
}
