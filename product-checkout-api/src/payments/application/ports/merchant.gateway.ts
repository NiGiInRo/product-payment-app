export const MERCHANT_GATEWAY = Symbol('MERCHANT_GATEWAY');

export interface MerchantAcceptanceTokens {
  acceptanceToken: string;
  acceptancePermalink: string;
  personalDataAuthToken?: string;
  personalDataAuthPermalink?: string;
}

export interface MerchantGateway {
  getMerchantAcceptanceTokens(
    merchantPublicKey: string,
  ): Promise<MerchantAcceptanceTokens>;
}
