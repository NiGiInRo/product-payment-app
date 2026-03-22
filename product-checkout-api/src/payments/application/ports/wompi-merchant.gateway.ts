export const WOMPI_MERCHANT_GATEWAY = Symbol('WOMPI_MERCHANT_GATEWAY');

export interface MerchantAcceptanceTokens {
  acceptanceToken: string;
  acceptancePermalink: string;
  personalDataAuthToken?: string;
  personalDataAuthPermalink?: string;
}

export interface WompiMerchantGateway {
  getMerchantAcceptanceTokens(
    merchantPublicKey: string,
  ): Promise<MerchantAcceptanceTokens>;
}
