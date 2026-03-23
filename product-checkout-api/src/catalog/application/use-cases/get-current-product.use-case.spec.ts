import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { GetCurrentProductUseCase } from './get-current-product.use-case';
import type { ProductRepository } from '../ports/product.repository';

describe('GetCurrentProductUseCase', () => {
  it('returns the current active product as the checkout response contract', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Auriculares Inalambricos Pro',
        description: 'Producto semillado',
        priceCents: 12990000,
        stock: 10,
        imageUrl: 'https://example.com/product.jpg',
        active: true,
      }),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const useCase = new GetCurrentProductUseCase(productRepository);

    await expect(useCase.execute()).resolves.toEqual({
      id: 'product-1',
      name: 'Auriculares Inalambricos Pro',
      description: 'Producto semillado',
      priceCents: 12990000,
      stock: 10,
      imageUrl: 'https://example.com/product.jpg',
      currency: 'COP',
    });
  });

  it('throws ProductNotFoundError when there is no active product', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const useCase = new GetCurrentProductUseCase(productRepository);

    await expect(useCase.execute()).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
