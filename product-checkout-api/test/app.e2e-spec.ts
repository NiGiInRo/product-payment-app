import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/shared/infrastructure/persistence/prisma/prisma.service';
import { setupApp } from './../src/setup-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
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
      data: { active: true, stock: 10 },
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
      priceCents: 129900,
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
      data: { active: true },
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
      amountCents: 129900,
      baseFeeCents: 0,
      deliveryFeeCents: 0,
      totalCents: 129900,
    });

    const transaction = await prismaService.transaction.findUniqueOrThrow({
      where: { id: response.body.transactionId },
    });

    createdTransactionIds.push(transaction.id);
    createdCustomerIds.push(transaction.customerId);
    createdDeliveryIds.push(transaction.deliveryId);

    expect(transaction.status).toBe('PENDING');
    expect(transaction.totalCents).toBe(129900);
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
});
