import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../ports/product.repository';
import type { ProductRepository } from '../ports/product.repository';
import { CurrentProductResponse } from '../dto/current-product.response';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';

@Injectable()
export class GetCurrentProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<CurrentProductResponse> {
    const product = await this.productRepository.findCurrentActive();

    if (!product) {
      throw new ProductNotFoundError();
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      stock: product.stock,
      imageUrl: product.imageUrl,
      currency: 'COP',
    };
  }
}
