import { createHash } from 'node:crypto';
import {
  PaymentGateway,
  ProcessCardPaymentResult,
} from '../../../payments/application/ports/payment.gateway';
import type { PaymentConfigProvider } from '../../../payments/application/ports/payment-config.provider';
import { PaymentProcessingError } from '../../../payments/domain/errors/payment-processing.error';
import type { TransactionRepository } from '../ports/transaction.repository';
import { ProcessTransactionPaymentUseCase } from './process-transaction-payment.use-case';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';
import { TransactionAlreadyProcessedError } from '../../domain/errors/transaction-already-processed.error';
import { TransactionNotFoundError } from '../../domain/errors/transaction-not-found.error';
import { ProductInactiveError } from '../../../catalog/domain/errors/product-inactive.error';
import { OutOfStockError } from '../../domain/errors/out-of-stock.error';

describe('ProcessTransactionPaymentUseCase', () => {
  const baseTransaction = {
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
    providerTransactionId: null,
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
  };

  function buildDependencies(
    paymentResult?: ProcessCardPaymentResult,
  ): {
    transactionRepository: TransactionRepository;
    paymentGateway: PaymentGateway;
    paymentConfigProvider: PaymentConfigProvider;
  } {
    return {
      transactionRepository: {
        findById: jest.fn(),
        findDetailsById: jest
          .fn()
          .mockResolvedValue(structuredClone(baseTransaction)),
        create: jest.fn(),
        createPendingBundle: jest.fn(),
        save: jest.fn().mockImplementation(async (transaction) => transaction),
        saveApprovedWithStockDecrement: jest
          .fn()
          .mockImplementation(async ({ transaction }) => transaction),
      },
      paymentGateway: {
        processCardPayment: jest
          .fn()
          .mockResolvedValue(
            paymentResult ?? {
              status: TransactionStatus.APPROVED,
              providerTransactionId: 'provider-transaction-1',
              statusReason: 'Transaction approved',
              processedAt: new Date('2026-03-22T12:00:00.000Z'),
            },
          ),
      },
      paymentConfigProvider: {
        getApiUrl: jest.fn(),
        getPublicKey: jest.fn(),
        getPrivateKey: jest.fn(),
        getIntegrityKey: jest.fn().mockReturnValue(
          'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp3',
        ),
      },
    };
  }

  it('processes an approved payment and stores the final status with the stock decrement atomically', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    const result = await useCase.execute({
      transactionId: 'transaction-1',
      paymentMethodToken: 'tok_test_approved',
      acceptanceToken: 'acceptance-token',
      personalDataAuthToken: 'personal-data-token',
      customerEmail: 'NICOLAS@example.com',
    });

    const expectedSignature = createHash('sha256')
      .update(
        'txn_transaction-112990000COPstagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp3',
      )
      .digest('hex');

    expect(paymentGateway.processCardPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'transaction-1',
        reference: 'txn_transaction-1',
        amountCents: 12990000,
        currency: 'COP',
        customerEmail: 'nicolas@example.com',
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        personalDataAuthToken: 'personal-data-token',
        signature: expectedSignature,
      }),
    );
    expect(transactionRepository.saveApprovedWithStockDecrement).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'product-1',
        transaction: expect.objectContaining({
          status: TransactionStatus.APPROVED,
          providerTransactionId: 'provider-transaction-1',
          statusReason: 'Transaction approved',
        }),
      }),
    );
    expect(result.status).toBe(TransactionStatus.APPROVED);
    expect(result.transactionId).toBe('transaction-1');
    expect(result.statusReason).toBe('Transaction approved');
  });

  it('stores a declined payment without touching the stock', async () => {
    const paymentResult: ProcessCardPaymentResult = {
      status: TransactionStatus.DECLINED,
      providerTransactionId: 'provider-declined',
      statusReason: 'Card declined in sandbox',
      processedAt: new Date('2026-03-22T12:10:00.000Z'),
    };
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies(paymentResult);
    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    const result = await useCase.execute({
      transactionId: 'transaction-1',
      paymentMethodToken: 'tok_test_declined',
      acceptanceToken: 'acceptance-token',
      customerEmail: 'nicolas@example.com',
    });

    expect(result.status).toBe(TransactionStatus.DECLINED);
    expect(transactionRepository.saveApprovedWithStockDecrement).not.toHaveBeenCalled();
    expect(transactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TransactionStatus.DECLINED,
        providerTransactionId: 'provider-declined',
      }),
    );
  });

  it('throws TransactionAlreadyProcessedError when the transaction is no longer pending', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    transactionRepository.findDetailsById = jest.fn().mockResolvedValue({
      ...structuredClone(baseTransaction),
      status: TransactionStatus.APPROVED,
    });

    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    await expect(
      useCase.execute({
        transactionId: 'transaction-1',
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'nicolas@example.com',
      }),
    ).rejects.toBeInstanceOf(TransactionAlreadyProcessedError);
  });

  it('throws TransactionNotFoundError when the transaction does not exist', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    transactionRepository.findDetailsById = jest.fn().mockResolvedValue(null);

    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    await expect(
      useCase.execute({
        transactionId: 'missing-transaction',
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'nicolas@example.com',
      }),
    ).rejects.toBeInstanceOf(TransactionNotFoundError);
  });

  it('throws ProductInactiveError when the product became inactive before processing', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    transactionRepository.findDetailsById = jest.fn().mockResolvedValue({
      ...structuredClone(baseTransaction),
      product: {
        ...structuredClone(baseTransaction.product),
        active: false,
      },
    });

    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    await expect(
      useCase.execute({
        transactionId: 'transaction-1',
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'nicolas@example.com',
      }),
    ).rejects.toBeInstanceOf(ProductInactiveError);
  });

  it('throws OutOfStockError when the product runs out of stock before processing', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    transactionRepository.findDetailsById = jest.fn().mockResolvedValue({
      ...structuredClone(baseTransaction),
      product: {
        ...structuredClone(baseTransaction.product),
        stock: 0,
      },
    });

    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    await expect(
      useCase.execute({
        transactionId: 'transaction-1',
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'nicolas@example.com',
      }),
    ).rejects.toBeInstanceOf(OutOfStockError);
  });

  it('marks the transaction as ERROR when the gateway fails technically', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    paymentGateway.processCardPayment = jest
      .fn()
      .mockRejectedValue(new PaymentProcessingError('Sandbox outage'));

    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    await expect(
      useCase.execute({
        transactionId: 'transaction-1',
        paymentMethodToken: 'tok_test_error',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'nicolas@example.com',
      }),
    ).rejects.toBeInstanceOf(PaymentProcessingError);

    expect(transactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TransactionStatus.ERROR,
        statusReason: 'Sandbox outage',
      }),
    );
    expect(transactionRepository.saveApprovedWithStockDecrement).not.toHaveBeenCalled();
  });

  it('wraps non-Error gateway failures into PaymentProcessingError', async () => {
    const { transactionRepository, paymentGateway, paymentConfigProvider } =
      buildDependencies();
    paymentGateway.processCardPayment = jest.fn().mockRejectedValue({
      reason: 'gateway-object',
    });

    const useCase = new ProcessTransactionPaymentUseCase(
      transactionRepository,
      paymentGateway,
      paymentConfigProvider,
    );

    await expect(
      useCase.execute({
        transactionId: 'transaction-1',
        paymentMethodToken: 'tok_test_error',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'nicolas@example.com',
      }),
    ).rejects.toBeInstanceOf(PaymentProcessingError);

    expect(transactionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TransactionStatus.ERROR,
        statusReason: 'Unexpected payment processing error.',
      }),
    );
  });
});
