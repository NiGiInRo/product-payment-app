export interface CurrentProductResponse {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  currency: 'COP';
}
