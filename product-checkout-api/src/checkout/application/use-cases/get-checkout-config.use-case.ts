import { Inject, Injectable } from '@nestjs/common';
import { CheckoutConfigResponse } from '../dto/checkout-config.response';
import {
  CHECKOUT_SETTINGS_PROVIDER,
  type CheckoutSettingsProvider,
} from '../ports/checkout-settings.provider';
import {
  WOMPI_MERCHANT_GATEWAY,
  type WompiMerchantGateway,
} from '../../../payments/application/ports/wompi-merchant.gateway';

@Injectable()
export class GetCheckoutConfigUseCase {
  constructor(
    @Inject(CHECKOUT_SETTINGS_PROVIDER)
    private readonly checkoutSettingsProvider: CheckoutSettingsProvider,
    @Inject(WOMPI_MERCHANT_GATEWAY)
    private readonly wompiMerchantGateway: WompiMerchantGateway,
  ) {}

  async execute(): Promise<CheckoutConfigResponse> {
    const publicKey = this.checkoutSettingsProvider.getWompiPublicKey();
    const merchantConfig =
      await this.wompiMerchantGateway.getMerchantAcceptanceTokens(publicKey);

    return {
      publicKey,
      acceptanceToken: merchantConfig.acceptanceToken,
      personalDataAuthToken: merchantConfig.personalDataAuthToken,
      legalLinks: {
        acceptance: merchantConfig.acceptancePermalink,
        personalDataAuthorization: merchantConfig.personalDataAuthPermalink,
      },
    };
  }
}
