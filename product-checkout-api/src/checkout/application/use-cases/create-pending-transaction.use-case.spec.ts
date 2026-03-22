import type { ProductRepository } from '../../../catalog/application/ports/product.repository';
import type { CustomerRepository } from '../ports/customer.repository';
import type { DeliveryRepository } from '../ports/delivery.repository';
import type { TransactionRepository } from '../ports/transaction.repository';
import type { CheckoutPricingProvider } from '../ports/checkout-pricing.provider';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { OutOfStockError } from '../../domain/errors/out-of-stock.error';
import { CreatePendingTransactionUseCase } from './create-pending-transaction.use-case';

describe('CreatePendingTransactionUseCase', () => {
  it('creates a pending transaction with pricing frozen by the backend', async () => {
    const productRepository: ProductRepository = {
      findCurrentActive: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Auriculares',
        description: 'Producto activo',
        priceCents: 129900,
        stock: 10,
        imageUrl: 'https://example.com/product.jpg',
        active: true,
      }),
      save: jest.fn(),
    };

    const customerRepository: CustomerRepository = {
      create: jest.fn().mockImplementation(async (customer) => customer),
    };

    const deliveryRepository: DeliveryRepository = {
      create: jest.fn().mockImplementation(async (delivery) => delivery),
    };

    const transactionRepository: TransactionRepository = {
      findById: jest.fn(),
      create: jest.fn().mockImplementation(async (transaction) => transaction),
      save: jest.fn(),
    };

    const checkoutPricingProvider: CheckoutPricingProvider = {
      getPricing: jest.fn().mockReturnValue({
        baseFeeCents: 5000,
        deliveryFeeCents: 10000,
      }),
    };

    const useCase = new CreatePendingTransactionUseCase(
      productRepository,
      customerRepository,
      deliveryRepository,
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
        city: ' Bogotá ',
        country: ' Colombia ',
      },
    });

    expect(result.status).toBe('PENDING');
    expect(result.pricing).toEqual({
      amountCents: 129900,
      baseFeeCents: 5000,
      deliveryFeeCents: 10000,
      totalCents: 144900,
    });
    expect(customerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Nicolas Infante',
        email: 'nicolas@example.com',
        phone: '3001234567',
      }),
    );
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TransactionStatus.PENDING,
        currency: 'COP',
        amountCents: 129900,
        totalCents: 144900,
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
        priceCents: 129900,
        stock: 0,
        imageUrl: 'https://example.com/product.jpg',
        active: true,
      }),
      save: jest.fn(),
    };

    const useCase = new CreatePendingTransactionUseCase(
      productRepository,
      { create: jest.fn() },
      { create: jest.fn() },
      { findById: jest.fn(), create: jest.fn(), save: jest.fn() },
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
});
