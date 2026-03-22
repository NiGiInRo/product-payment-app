import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { ProductPrismaMapper } from './mappers/product-prisma.mapper';
import { ProductRepository } from '../../../application/ports/product.repository';
import { Product } from '../../../domain/entities/product.entity';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findCurrentActive(): Promise<Product | null> {
    const product = await this.prismaService.product.findFirst({
      where: { active: true },
    });

    return product ? ProductPrismaMapper.toDomain(product) : null;
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    return product ? ProductPrismaMapper.toDomain(product) : null;
  }

  async save(product: Product): Promise<Product> {
    const savedProduct = await this.prismaService.product.update({
      where: { id: product.id },
      data: {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        stock: product.stock,
        imageUrl: product.imageUrl,
        active: product.active,
      },
    });

    return ProductPrismaMapper.toDomain(savedProduct);
  }
}
