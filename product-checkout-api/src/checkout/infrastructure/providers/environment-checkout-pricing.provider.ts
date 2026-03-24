import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CheckoutPricing,
  CheckoutPricingProvider,
} from '../../application/ports/checkout-pricing.provider';

@Injectable()
export class EnvironmentCheckoutPricingProvider
  implements CheckoutPricingProvider
{
  constructor(private readonly configService: ConfigService) {}

  getPricing(): CheckoutPricing {
    return {
      baseFeeCents: Number(
        this.configService.get<string>('BASE_FEE_CENTS') ?? 0,
      ),
      deliveryFeeCents: Number(
        this.configService.get<string>('DELIVERY_FEE_CENTS') ?? 0,
      ),
    };
  }
}
