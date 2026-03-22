import type { CheckoutSettingsProvider } from '../ports/checkout-settings.provider';
import type { WompiMerchantGateway } from '../../../payments/application/ports/wompi-merchant.gateway';
import { GetCheckoutConfigUseCase } from './get-checkout-config.use-case';

describe('GetCheckoutConfigUseCase', () => {
  it('returns the checkout config contract for the frontend', async () => {
    const checkoutSettingsProvider: CheckoutSettingsProvider = {
      getWompiPublicKey: jest.fn().mockReturnValue('pub_test_123'),
    };

    const wompiMerchantGateway: WompiMerchantGateway = {
      getMerchantAcceptanceTokens: jest.fn().mockResolvedValue({
        acceptanceToken: 'acceptance-token',
        acceptancePermalink: 'https://wompi.co/acceptance',
        personalDataAuthToken: 'personal-data-token',
        personalDataAuthPermalink: 'https://wompi.co/personal-data',
      }),
    };

    const useCase = new GetCheckoutConfigUseCase(
      checkoutSettingsProvider,
      wompiMerchantGateway,
    );

    await expect(useCase.execute()).resolves.toEqual({
      publicKey: 'pub_test_123',
      acceptanceToken: 'acceptance-token',
      personalDataAuthToken: 'personal-data-token',
      legalLinks: {
        acceptance: 'https://wompi.co/acceptance',
        personalDataAuthorization: 'https://wompi.co/personal-data',
      },
    });
  });
});
