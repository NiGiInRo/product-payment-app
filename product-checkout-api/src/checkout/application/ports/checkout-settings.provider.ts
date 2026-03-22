export const CHECKOUT_SETTINGS_PROVIDER = Symbol('CHECKOUT_SETTINGS_PROVIDER');

export interface CheckoutSettingsProvider {
  getWompiPublicKey(): string;
}
