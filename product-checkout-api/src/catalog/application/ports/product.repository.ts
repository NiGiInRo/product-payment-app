import { Product } from '../../domain/entities/product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findCurrentActive(): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
}
