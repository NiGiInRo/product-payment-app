import { Module } from '@nestjs/common';
import { PAYMENT_CONFIG_PROVIDER } from './application/ports/payment-config.provider';
import { PAYMENT_GATEWAY } from './application/ports/payment.gateway';
import { WOMPI_MERCHANT_GATEWAY } from './application/ports/wompi-merchant.gateway';
import { EnvironmentPaymentConfigProvider } from './infrastructure/providers/environment-payment-config.provider';
import { WompiMerchantHttpGateway } from './infrastructure/wompi/wompi-merchant.gateway';
import { WompiPaymentGateway } from './infrastructure/wompi/wompi-payment.gateway';

@Module({
  providers: [
    EnvironmentPaymentConfigProvider,
    WompiMerchantHttpGateway,
    WompiPaymentGateway,
    {
      provide: PAYMENT_CONFIG_PROVIDER,
      useExisting: EnvironmentPaymentConfigProvider,
    },
    {
      provide: PAYMENT_GATEWAY,
      useExisting: WompiPaymentGateway,
    },
    {
      provide: WOMPI_MERCHANT_GATEWAY,
      useExisting: WompiMerchantHttpGateway,
    },
  ],
  exports: [PAYMENT_CONFIG_PROVIDER, PAYMENT_GATEWAY, WOMPI_MERCHANT_GATEWAY],
})
export class PaymentsModule {}
