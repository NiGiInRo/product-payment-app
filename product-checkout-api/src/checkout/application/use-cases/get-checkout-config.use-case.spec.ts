import type { CheckoutSettingsProvider } from '../ports/checkout-settings.provider';
import type { MerchantGateway } from '../../../payments/application/ports/merchant.gateway';
import { GetCheckoutConfigUseCase } from './get-checkout-config.use-case';

describe('GetCheckoutConfigUseCase', () => {
  it('returns the checkout config contract for the frontend', async () => {
    const checkoutSettingsProvider: CheckoutSettingsProvider = {
      getPublicKey: jest.fn().mockReturnValue('pub_test_123'),
    };

    const merchantGateway: MerchantGateway = {
      getMerchantAcceptanceTokens: jest.fn().mockResolvedValue({
        acceptanceToken: 'acceptance-token',
        acceptancePermalink: 'https://sandbox-provider.test/acceptance',
        personalDataAuthToken: 'personal-data-token',
        personalDataAuthPermalink: 'https://sandbox-provider.test/personal-data',
      }),
    };

    const useCase = new GetCheckoutConfigUseCase(
      checkoutSettingsProvider,
      merchantGateway,
    );

    await expect(useCase.execute()).resolves.toEqual({
      publicKey: 'pub_test_123',
      acceptanceToken: 'acceptance-token',
      personalDataAuthToken: 'personal-data-token',
      legalLinks: {
        acceptance: 'https://sandbox-provider.test/acceptance',
        personalDataAuthorization: 'https://sandbox-provider.test/personal-data',
      },
    });
  });

  it('keeps personal data authorization optional when the provider does not return it', async () => {
    const checkoutSettingsProvider: CheckoutSettingsProvider = {
      getPublicKey: jest.fn().mockReturnValue('pub_test_123'),
    };

    const merchantGateway: MerchantGateway = {
      getMerchantAcceptanceTokens: jest.fn().mockResolvedValue({
        acceptanceToken: 'acceptance-token',
        acceptancePermalink: 'https://sandbox-provider.test/acceptance',
        personalDataAuthToken: undefined,
        personalDataAuthPermalink: undefined,
      }),
    };

    const useCase = new GetCheckoutConfigUseCase(
      checkoutSettingsProvider,
      merchantGateway,
    );

    await expect(useCase.execute()).resolves.toEqual({
      publicKey: 'pub_test_123',
      acceptanceToken: 'acceptance-token',
      personalDataAuthToken: undefined,
      legalLinks: {
        acceptance: 'https://sandbox-provider.test/acceptance',
        personalDataAuthorization: undefined,
      },
    });
  });
});
