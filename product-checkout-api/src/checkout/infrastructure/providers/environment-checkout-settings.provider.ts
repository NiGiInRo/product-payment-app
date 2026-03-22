import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutSettingsProvider } from '../../application/ports/checkout-settings.provider';
import { WompiMerchantConfigError } from '../../../payments/domain/errors/wompi-merchant-config.error';

@Injectable()
export class EnvironmentCheckoutSettingsProvider
  implements CheckoutSettingsProvider
{
  constructor(private readonly configService: ConfigService) {}

  getWompiPublicKey(): string {
    const publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY');

    if (!publicKey || publicKey.includes('placeholder')) {
      throw new WompiMerchantConfigError(
        'WOMPI_PUBLIC_KEY is not configured with a real sandbox or production key.',
      );
    }

    return publicKey;
  }
}
