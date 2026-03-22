import type { TransactionRepository } from '../ports/transaction.repository';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import { GetTransactionStatusUseCase } from './get-transaction-status.use-case';

describe('GetTransactionStatusUseCase', () => {
  it('returns the transaction status payload for refresh recovery', async () => {
    const transactionRepository: TransactionRepository = {
      findById: jest.fn(),
      findDetailsById: jest.fn().mockResolvedValue({
        id: 'transaction-1',
        status: TransactionStatus.PENDING,
        productId: 'product-1',
        customerId: 'customer-1',
        deliveryId: 'delivery-1',
        amountCents: 12990000,
        baseFeeCents: 0,
        deliveryFeeCents: 0,
        totalCents: 12990000,
        currency: 'COP',
        wompiTransactionId: null,
        statusReason: null,
        processedAt: null,
        createdAt: new Date('2026-03-22T00:00:00.000Z'),
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
        product: {
          id: 'product-1',
          name: 'Auriculares',
          description: 'Producto activo',
          priceCents: 12990000,
          stock: 10,
          imageUrl: 'https://example.com/product.jpg',
          active: true,
        },
        customer: {
          id: 'customer-1',
          fullName: 'Nicolas Infante',
          email: 'nicolas@example.com',
          phone: '3001234567',
        },
        delivery: {
          id: 'delivery-1',
          addressLine1: 'Calle 123',
          addressLine2: null,
          city: 'Bogota',
          region: null,
          postalCode: null,
          country: 'Colombia',
          notes: null,
        },
      }),
      create: jest.fn(),
      save: jest.fn(),
    };

    const useCase = new GetTransactionStatusUseCase(transactionRepository);

    await expect(useCase.execute('transaction-1')).resolves.toEqual({
      transactionId: 'transaction-1',
      status: TransactionStatus.PENDING,
      statusReason: null,
      pricing: {
        amountCents: 12990000,
        baseFeeCents: 0,
        deliveryFeeCents: 0,
        totalCents: 12990000,
        currency: 'COP',
      },
      product: {
        id: 'product-1',
        name: 'Auriculares',
        description: 'Producto activo',
        imageUrl: 'https://example.com/product.jpg',
      },
      customer: {
        id: 'customer-1',
        fullName: 'Nicolas Infante',
        email: 'nicolas@example.com',
        phone: '3001234567',
      },
      delivery: {
        id: 'delivery-1',
        addressLine1: 'Calle 123',
        addressLine2: null,
        city: 'Bogota',
        region: null,
        postalCode: null,
        country: 'Colombia',
        notes: null,
      },
    });
  });

  it('throws TransactionNotFoundError when the transaction does not exist', async () => {
    const transactionRepository: TransactionRepository = {
      findById: jest.fn(),
      findDetailsById: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };

    const useCase = new GetTransactionStatusUseCase(transactionRepository);

    await expect(useCase.execute('missing-transaction')).rejects.toBeInstanceOf(
      TransactionNotFoundError,
    );
  });
});
