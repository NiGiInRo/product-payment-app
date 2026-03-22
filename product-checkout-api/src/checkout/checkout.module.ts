import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CHECKOUT_PRICING_PROVIDER } from './application/ports/checkout-pricing.provider';
import { CHECKOUT_SETTINGS_PROVIDER } from './application/ports/checkout-settings.provider';
import { CUSTOMER_REPOSITORY } from './application/ports/customer.repository';
import { DELIVERY_REPOSITORY } from './application/ports/delivery.repository';
import { TRANSACTION_REPOSITORY } from './application/ports/transaction.repository';
import { CreatePendingTransactionUseCase } from './application/use-cases/create-pending-transaction.use-case';
import { GetCheckoutConfigUseCase } from './application/use-cases/get-checkout-config.use-case';
import { GetTransactionStatusUseCase } from './application/use-cases/get-transaction-status.use-case';
import { ProcessTransactionPaymentUseCase } from './application/use-cases/process-transaction-payment.use-case';
import { CheckoutController } from './controllers/checkout.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { EnvironmentCheckoutPricingProvider } from './infrastructure/providers/environment-checkout-pricing.provider';
import { EnvironmentCheckoutSettingsProvider } from './infrastructure/providers/environment-checkout-settings.provider';
import { PrismaCustomerRepository } from './infrastructure/persistence/prisma/prisma-customer.repository';
import { PrismaDeliveryRepository } from './infrastructure/persistence/prisma/prisma-delivery.repository';
import { PrismaTransactionRepository } from './infrastructure/persistence/prisma/prisma-transaction.repository';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [CatalogModule, PaymentsModule],
  controllers: [CheckoutController, TransactionsController],
  providers: [
    GetCheckoutConfigUseCase,
    CreatePendingTransactionUseCase,
    GetTransactionStatusUseCase,
    ProcessTransactionPaymentUseCase,
    EnvironmentCheckoutSettingsProvider,
    EnvironmentCheckoutPricingProvider,
    PrismaCustomerRepository,
    PrismaDeliveryRepository,
    PrismaTransactionRepository,
    {
      provide: CHECKOUT_SETTINGS_PROVIDER,
      useExisting: EnvironmentCheckoutSettingsProvider,
    },
    {
      provide: CHECKOUT_PRICING_PROVIDER,
      useExisting: EnvironmentCheckoutPricingProvider,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useExisting: PrismaCustomerRepository,
    },
    {
      provide: DELIVERY_REPOSITORY,
      useExisting: PrismaDeliveryRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useExisting: PrismaTransactionRepository,
    },
  ],
})
export class CheckoutModule {}
