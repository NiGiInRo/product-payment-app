import type { ProductRepository } from '../../../catalog/application/ports/product.repository';
import type { TransactionRepository } from '../ports/transaction.repository';
import type { CheckoutPricingProvider } from '../ports/checkout-pricing.provider';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { OutOfStockError } from '../../domain/errors/out-of-stock.error';
import { CreatePendingTransactionUseCase } from './create-pending-transaction.use-case';
import { ProductNotFoundError } from '../../../catalog/domain/errors/product-not-found.error';
import { ProductInactiveError } from '../../../catalog/domain/errors/product-inactive.error';

describe('CreatePendingTransactionUseCase', () => {
  it('creates a pending transaction with pricing frozen by the backend', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Auriculares',
        description: 'Producto activo',
        priceCents: 12990000,
        stock: 10,
        imageUrl: 'https://example.com/product.jpg',
        active: true,
      }),
      save: jest.fn(),
    };

    const transactionRepository: TransactionRepository = {
      findById: jest.fn(),
      findDetailsById: jest.fn(),
      create: jest.fn(),
      createPendingBundle: jest
        .fn()
        .mockImplementation(async ({ transaction }) => transaction),
      save: jest.fn(),
      saveApprovedWithStockDecrement: jest.fn(),
    };

    const checkoutPricingProvider: CheckoutPricingProvider = {
      getPricing: jest.fn().mockReturnValue({
        baseFeeCents: 5000,
        deliveryFeeCents: 10000,
      }),
    };

    const useCase = new CreatePendingTransactionUseCase(
      productRepository,
      transactionRepository,
      checkoutPricingProvider,
    );

    const result = await useCase.execute({
      productId: '11111111-1111-4111-8111-111111111111',
      customer: {
        fullName: ' Nicolas Infante ',
        email: ' NICOLAS@example.com ',
        phone: ' 3001234567 ',
      },
      delivery: {
        addressLine1: ' Calle 1 # 2 - 3 ',
        city: ' BogotÃ¡ ',
        country: ' Colombia ',
      },
    });

    expect(result.status).toBe('PENDING');
    expect(result.pricing).toEqual({
      amountCents: 12990000,
      baseFeeCents: 5000,
      deliveryFeeCents: 10000,
      totalCents: 13005000,
    });
    expect(transactionRepository.createPendingBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({
          fullName: 'Nicolas Infante',
          email: 'nicolas@example.com',
          phone: '3001234567',
        }),
        transaction: expect.objectContaining({
          status: TransactionStatus.PENDING,
          currency: 'COP',
          amountCents: 12990000,
          totalCents: 13005000,
        }),
      }),
    );
  });

  it('throws OutOfStockError when the product stock is empty', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Auriculares',
        description: 'Sin stock',
        priceCents: 12990000,
        stock: 0,
        imageUrl: 'https://example.com/product.jpg',
        active: true,
      }),
      save: jest.fn(),
    };

    const useCase = new CreatePendingTransactionUseCase(
      productRepository,
      {
        findById: jest.fn(),
        findDetailsById: jest.fn(),
        create: jest.fn(),
        createPendingBundle: jest.fn(),
        save: jest.fn(),
        saveApprovedWithStockDecrement: jest.fn(),
      },
      {
        getPricing: jest.fn().mockReturnValue({
          baseFeeCents: 0,
          deliveryFeeCents: 0,
        }),
      },
    );

    await expect(
      useCase.execute({
        productId: 'product-1',
        customer: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Street 123',
          city: 'Bogota',
          country: 'Colombia',
        },
      }),
    ).rejects.toBeInstanceOf(OutOfStockError);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };

    const useCase = new CreatePendingTransactionUseCase(
      productRepository,
      {
        findById: jest.fn(),
        findDetailsById: jest.fn(),
        create: jest.fn(),
        createPendingBundle: jest.fn(),
        save: jest.fn(),
        saveApprovedWithStockDecrement: jest.fn(),
      },
      {
        getPricing: jest.fn().mockReturnValue({
          baseFeeCents: 0,
          deliveryFeeCents: 0,
        }),
      },
    );

    await expect(
      useCase.execute({
        productId: 'missing-product',
        customer: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Street 123',
          city: 'Bogota',
          country: 'Colombia',
        },
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('throws ProductInactiveError when the product is not active', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'inactive-product',
        name: 'Auriculares',
        description: 'Producto inactivo',
        priceCents: 12990000,
        stock: 10,
        imageUrl: 'https://example.com/product.jpg',
        active: false,
      }),
      save: jest.fn(),
    };

    const useCase = new CreatePendingTransactionUseCase(
      productRepository,
      {
        findById: jest.fn(),
        findDetailsById: jest.fn(),
        create: jest.fn(),
        createPendingBundle: jest.fn(),
        save: jest.fn(),
        saveApprovedWithStockDecrement: jest.fn(),
      },
      {
        getPricing: jest.fn().mockReturnValue({
          baseFeeCents: 0,
          deliveryFeeCents: 0,
        }),
      },
    );

    await expect(
      useCase.execute({
        productId: 'inactive-product',
        customer: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Street 123',
          city: 'Bogota',
          country: 'Colombia',
        },
      }),
    ).rejects.toBeInstanceOf(ProductInactiveError);
  });
});
