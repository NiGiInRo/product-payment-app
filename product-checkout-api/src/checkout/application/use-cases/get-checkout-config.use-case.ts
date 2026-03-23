import { Inject, Injectable } from '@nestjs/common';
import { CheckoutConfigResponse } from '../dto/checkout-config.response';
import {
  CHECKOUT_SETTINGS_PROVIDER,
  type CheckoutSettingsProvider,
} from '../ports/checkout-settings.provider';
import {
  MERCHANT_GATEWAY,
  type MerchantGateway,
} from '../../../payments/application/ports/merchant.gateway';

@Injectable()
export class GetCheckoutConfigUseCase {
  constructor(
    @Inject(CHECKOUT_SETTINGS_PROVIDER)
    private readonly checkoutSettingsProvider: CheckoutSettingsProvider,
    @Inject(MERCHANT_GATEWAY)
    private readonly merchantGateway: MerchantGateway,
  ) {}

  async execute(): Promise<CheckoutConfigResponse> {
    const publicKey = this.checkoutSettingsProvider.getPublicKey();
    const merchantConfig =
      await this.merchantGateway.getMerchantAcceptanceTokens(publicKey);

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
