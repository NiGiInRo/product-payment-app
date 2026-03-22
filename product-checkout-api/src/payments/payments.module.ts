import { Module } from '@nestjs/common';
import { WOMPI_MERCHANT_GATEWAY } from './application/ports/wompi-merchant.gateway';
import { WompiMerchantHttpGateway } from './infrastructure/wompi/wompi-merchant.gateway';

@Module({
  providers: [
    WompiMerchantHttpGateway,
    {
      provide: WOMPI_MERCHANT_GATEWAY,
      useExisting: WompiMerchantHttpGateway,
    },
  ],
  exports: [WOMPI_MERCHANT_GATEWAY],
})
export class PaymentsModule {}
