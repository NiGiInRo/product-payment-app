import { Product as PrismaProduct } from '../../../../../generated/prisma/client.js';
import { Product } from '../../../../domain/entities/product.entity';

export class ProductPrismaMapper {
  static toDomain(prismaProduct: PrismaProduct): Product {
    return {
      id: prismaProduct.id,
      name: prismaProduct.name,
      description: prismaProduct.description,
      priceCents: prismaProduct.priceCents,
      stock: prismaProduct.stock,
      imageUrl: prismaProduct.imageUrl,
      active: prismaProduct.active,
    };
  }
}
