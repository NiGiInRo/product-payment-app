import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutSettingsProvider } from '../../application/ports/checkout-settings.provider';
import { MerchantConfigError } from '../../../payments/domain/errors/merchant-config.error';

@Injectable()
export class EnvironmentCheckoutSettingsProvider
  implements CheckoutSettingsProvider
{
  constructor(private readonly configService: ConfigService) {}

  getPublicKey(): string {
    const publicKey =
      this.configService.get<string>('PAYMENT_PROVIDER_PUBLIC_KEY') ??
      this.configService.get<string>('WOMPI_PUBLIC_KEY');

    if (!publicKey || publicKey.includes('placeholder')) {
      throw new MerchantConfigError(
        'PAYMENT_PROVIDER_PUBLIC_KEY is not configured with a real sandbox or production key.',
      );
    }

    return publicKey;
  }
}
