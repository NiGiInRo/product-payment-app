import { Module } from '@nestjs/common';
import { GetCurrentProductUseCase } from './application/use-cases/get-current-product.use-case';
import { PRODUCT_REPOSITORY } from './application/ports/product.repository';
import { ProductsController } from './controllers/products.controller';
import { PrismaProductRepository } from './infrastructure/persistence/prisma/prisma-product.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    GetCurrentProductUseCase,
    PrismaProductRepository,
    {
      provide: PRODUCT_REPOSITORY,
      useExisting: PrismaProductRepository,
    },
  ],
  exports: [GetCurrentProductUseCase, PRODUCT_REPOSITORY],
})
export class CatalogModule {}
