import { Module } from '@nestjs/common';
import { PAYMENT_CONFIG_PROVIDER } from './application/ports/payment-config.provider';
import { PAYMENT_GATEWAY } from './application/ports/payment.gateway';
import { MERCHANT_GATEWAY } from './application/ports/merchant.gateway';
import { EnvironmentPaymentConfigProvider } from './infrastructure/providers/environment-payment-config.provider';
import { ProviderMerchantHttpGateway } from './infrastructure/provider/provider-merchant.gateway';
import { ProviderPaymentGateway } from './infrastructure/provider/provider-payment.gateway';

@Module({
  providers: [
    EnvironmentPaymentConfigProvider,
    ProviderMerchantHttpGateway,
    ProviderPaymentGateway,
    {
      provide: PAYMENT_CONFIG_PROVIDER,
      useExisting: EnvironmentPaymentConfigProvider,
    },
    {
      provide: PAYMENT_GATEWAY,
      useExisting: ProviderPaymentGateway,
    },
    {
      provide: MERCHANT_GATEWAY,
      useExisting: ProviderMerchantHttpGateway,
    },
  ],
  exports: [PAYMENT_CONFIG_PROVIDER, PAYMENT_GATEWAY, MERCHANT_GATEWAY],
})
export class PaymentsModule {}
