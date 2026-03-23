export interface CreatePendingTransactionCommand {
  productId: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  delivery: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
    notes?: string;
  };
}
