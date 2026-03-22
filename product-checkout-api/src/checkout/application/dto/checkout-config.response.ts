export interface CheckoutConfigResponse {
  publicKey: string;
  acceptanceToken: string;
  personalDataAuthToken?: string;
  legalLinks: {
    acceptance: string;
    personalDataAuthorization?: string;
  };
}
