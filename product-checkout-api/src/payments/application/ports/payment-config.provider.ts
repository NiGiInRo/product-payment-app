export const PAYMENT_CONFIG_PROVIDER = Symbol('PAYMENT_CONFIG_PROVIDER');

export interface PaymentConfigProvider {
  getApiUrl(): string;
  getPublicKey(): string;
  getPrivateKey(): string;
  getIntegrityKey(): string;
}
