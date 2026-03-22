export const PAYMENT_CONFIG_PROVIDER = Symbol('PAYMENT_CONFIG_PROVIDER');

export interface PaymentConfigProvider {
  getWompiApiUrl(): string;
  getWompiPublicKey(): string;
  getWompiPrivateKey(): string;
  getWompiIntegrityKey(): string;
}
