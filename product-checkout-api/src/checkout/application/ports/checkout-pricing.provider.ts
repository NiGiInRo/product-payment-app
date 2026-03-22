export const CHECKOUT_PRICING_PROVIDER = Symbol('CHECKOUT_PRICING_PROVIDER');

export interface CheckoutPricing {
  baseFeeCents: number;
  deliveryFeeCents: number;
}

export interface CheckoutPricingProvider {
  getPricing(): CheckoutPricing;
}
