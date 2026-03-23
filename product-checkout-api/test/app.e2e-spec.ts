import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PAYMENT_GATEWAY, type PaymentGateway } from './../src/payments/application/ports/payment.gateway';
import { PaymentProcessingError } from './../src/payments/domain/errors/payment-processing.error';
import { TransactionStatus } from './../src/checkout/domain/enums/transaction-status.enum';
import { PrismaService } from './../src/shared/infrastructure/persistence/prisma/prisma.service';
import { setupApp } from './../src/setup-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let paymentGateway: PaymentGateway;
  const seededProductId = '11111111-1111-4111-8111-111111111111';
  const createdTransactionIds: string[] = [];
  const createdCustomerIds: string[] = [];
  const createdDeliveryIds: string[] = [];
  const pendingCustomerEmail = `pending-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prismaService = app.get(PrismaService);
    paymentGateway = app.get(PAYMENT_GATEWAY);
  });

  afterAll(async () => {
    if (createdTransactionIds.length > 0) {
      await prismaService.transaction.deleteMany({
        where: { id: { in: createdTransactionIds } },
      });
    }
    if (createdCustomerIds.length > 0) {
      await prismaService.customer.deleteMany({
        where: { id: { in: createdCustomerIds } },
      });
    }
    if (createdDeliveryIds.length > 0) {
      await prismaService.delivery.deleteMany({
        where: { id: { in: createdDeliveryIds } },
      });
    }
    await prismaService.product.updateMany({
      where: { id: seededProductId },
      data: { active: true, stock: 10 },
    });
    await prismaService.product.updateMany({
      where: { id: { not: seededProductId } },
      data: { active: false },
    });
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        name: 'product-checkout-api',
        status: 'ok',
        docsPath: '/docs',
      });
  });

  it('/docs (GET)', () => {
    return request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Swagger UI');
      });
  });

  it('/products/current (GET)', () => {
    return request(app.getHttpServer()).get('/products/current').expect(200).expect({
      id: seededProductId,
      name: 'Auriculares Inalambricos Pro',
      description:
        'Auriculares bluetooth con cancelacion de ruido y autonomia de larga duracion.',
      priceCents: 12990000,
      stock: 10,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      currency: 'COP',
    });
  });

  it('/products/current (GET) returns 404 when no active product exists', async () => {
    await prismaService.product.updateMany({
      data: { active: false },
    });

    await request(app.getHttpServer()).get('/products/current').expect(404);

    await prismaService.product.updateMany({
      where: { id: seededProductId },
      data: { active: true },
    });
    await prismaService.product.updateMany({
      where: { id: { not: seededProductId } },
      data: { active: false },
    });
  });

  it('/products/current (GET) ignores legacy inactive seeded products', async () => {
    await prismaService.product.updateMany({
      where: { id: { not: seededProductId } },
      data: { active: false },
    });

    await request(app.getHttpServer())
      .get('/products/current')
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe(seededProductId);
      });
  });

  it('/checkout/config (GET) returns sandbox acceptance tokens', () => {
    return request(app.getHttpServer())
      .get('/checkout/config')
      .expect(200)
      .expect((response) => {
        expect(response.body.publicKey).toContain('pub_');
        expect(response.body.acceptanceToken).toBeTruthy();
      });
  });

  it('/transactions (POST) creates a pending transaction with frozen pricing', async () => {
    const response = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: seededProductId,
        customer: {
          fullName: 'Nicolas Infante',
          email: pendingCustomerEmail,
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Calle 123 # 45 - 67',
          city: 'Bogota',
          country: 'Colombia',
        },
      })
      .expect(201);

    expect(response.body.status).toBe('PENDING');
    expect(response.body.pricing).toEqual({
      amountCents: 12990000,
      baseFeeCents: 0,
      deliveryFeeCents: 0,
      totalCents: 12990000,
    });

    const transaction = await prismaService.transaction.findUniqueOrThrow({
      where: { id: response.body.transactionId },
    });

    createdTransactionIds.push(transaction.id);
    createdCustomerIds.push(transaction.customerId);
    createdDeliveryIds.push(transaction.deliveryId);

    expect(transaction.status).toBe('PENDING');
    expect(transaction.totalCents).toBe(12990000);

    await request(app.getHttpServer())
      .get(`/transactions/${response.body.transactionId}`)
      .expect(200)
      .expect((statusResponse) => {
        expect(statusResponse.body.transactionId).toBe(response.body.transactionId);
        expect(statusResponse.body.status).toBe('PENDING');
        expect(statusResponse.body.product.id).toBe(seededProductId);
        expect(statusResponse.body.customer.email).toBe(pendingCustomerEmail);
      });
  });

  it('/transactions (POST) returns 409 when stock is exhausted', async () => {
    await prismaService.product.update({
      where: { id: seededProductId },
      data: { stock: 0 },
    });

    await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: seededProductId,
        customer: {
          fullName: 'Out Of Stock',
          email: 'out-of-stock@example.com',
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Calle 000',
          city: 'Bogota',
          country: 'Colombia',
        },
      })
      .expect(409);

    await prismaService.product.update({
      where: { id: seededProductId },
      data: { stock: 10 },
    });
  });

  it('/transactions/:id (GET) returns 404 when the transaction does not exist', () => {
    return request(app.getHttpServer())
      .get('/transactions/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('/transactions/:id (GET) returns 400 for malformed UUIDs', () => {
    return request(app.getHttpServer()).get('/transactions/not-a-uuid').expect(400);
  });

  it('/transactions/:id/process-payment (POST) marks the transaction approved and decreases stock', async () => {
    const customerEmail = `approved-${Date.now()}@example.com`;
    const createdResponse = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: seededProductId,
        customer: {
          fullName: 'Approved Payment',
          email: customerEmail,
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Calle aprobada 123',
          city: 'Bogota',
          country: 'Colombia',
        },
      })
      .expect(201);

    const transaction = await prismaService.transaction.findUniqueOrThrow({
      where: { id: createdResponse.body.transactionId },
    });

    createdTransactionIds.push(transaction.id);
    createdCustomerIds.push(transaction.customerId);
    createdDeliveryIds.push(transaction.deliveryId);

    const paymentSpy = jest
      .spyOn(paymentGateway, 'processCardPayment')
      .mockResolvedValue({
        status: TransactionStatus.APPROVED,
        providerTransactionId: 'provider-approved-1',
        statusReason: 'Transaction approved',
        processedAt: new Date('2026-03-22T12:00:00.000Z'),
      });

    await request(app.getHttpServer())
      .post(`/transactions/${transaction.id}/process-payment`)
      .send({
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        personalDataAuthToken: 'personal-data-token',
        customerEmail,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.transactionId).toBe(transaction.id);
        expect(response.body.status).toBe('APPROVED');
        expect(response.body.statusReason).toBe('Transaction approved');
      });

    expect(paymentSpy).toHaveBeenCalledTimes(1);

    const persistedTransaction = await prismaService.transaction.findUniqueOrThrow({
      where: { id: transaction.id },
    });
    expect(persistedTransaction.status).toBe('APPROVED');
    expect(persistedTransaction.providerTransactionId).toBe('provider-approved-1');
    expect(persistedTransaction.processedAt).not.toBeNull();

    const product = await prismaService.product.findUniqueOrThrow({
      where: { id: seededProductId },
    });
    expect(product.stock).toBe(9);

    await request(app.getHttpServer())
      .post(`/transactions/${transaction.id}/process-payment`)
      .send({
        paymentMethodToken: 'tok_test_approved',
        acceptanceToken: 'acceptance-token',
        customerEmail,
      })
      .expect(409);

    expect(paymentSpy).toHaveBeenCalledTimes(1);
    paymentSpy.mockRestore();

    await prismaService.product.update({
      where: { id: seededProductId },
      data: { stock: 10 },
    });
  });

  it('/transactions/:id/process-payment (POST) stores ERROR and returns 502 on technical gateway failures', async () => {
    await prismaService.product.update({
      where: { id: seededProductId },
      data: { stock: 10 },
    });

    const customerEmail = `error-${Date.now()}@example.com`;
    const createdResponse = await request(app.getHttpServer())
      .post('/transactions')
      .send({
        productId: seededProductId,
        customer: {
          fullName: 'Gateway Error',
          email: customerEmail,
          phone: '3001234567',
        },
        delivery: {
          addressLine1: 'Calle error 456',
          city: 'Bogota',
          country: 'Colombia',
        },
      })
      .expect(201);

    const transaction = await prismaService.transaction.findUniqueOrThrow({
      where: { id: createdResponse.body.transactionId },
    });

    createdTransactionIds.push(transaction.id);
    createdCustomerIds.push(transaction.customerId);
    createdDeliveryIds.push(transaction.deliveryId);

    const paymentSpy = jest
      .spyOn(paymentGateway, 'processCardPayment')
      .mockRejectedValue(new PaymentProcessingError('Sandbox outage'));

    await request(app.getHttpServer())
      .post(`/transactions/${transaction.id}/process-payment`)
      .send({
        paymentMethodToken: 'tok_test_error',
        acceptanceToken: 'acceptance-token',
        customerEmail,
      })
      .expect(502)
      .expect((response) => {
        expect(response.body.message).toContain('Sandbox outage');
      });

    paymentSpy.mockRestore();

    const persistedTransaction = await prismaService.transaction.findUniqueOrThrow({
      where: { id: transaction.id },
    });
    expect(persistedTransaction.status).toBe('ERROR');
    expect(persistedTransaction.statusReason).toContain('Sandbox outage');
    expect(persistedTransaction.providerTransactionId).toBeNull();
    expect(persistedTransaction.processedAt).not.toBeNull();

    const product = await prismaService.product.findUniqueOrThrow({
      where: { id: seededProductId },
    });
    expect(product.stock).toBe(10);

    await request(app.getHttpServer())
      .get(`/transactions/${transaction.id}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ERROR');
        expect(response.body.statusReason).toContain('Sandbox outage');
      });
  });

  it('/transactions/:id/process-payment (POST) returns 400 for malformed UUIDs', () => {
    return request(app.getHttpServer())
      .post('/transactions/not-a-uuid/process-payment')
      .send({
        paymentMethodToken: 'tok_test_invalid',
        acceptanceToken: 'acceptance-token',
        customerEmail: 'invalid@example.com',
      })
      .expect(400);
  });
});
