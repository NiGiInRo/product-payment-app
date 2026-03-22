import { Delivery as PrismaDelivery } from '../../../../../generated/prisma/client.js';
import { Delivery } from '../../../../domain/entities/delivery.entity';

export class DeliveryPrismaMapper {
  static toDomain(prismaDelivery: PrismaDelivery): Delivery {
    return {
      id: prismaDelivery.id,
      addressLine1: prismaDelivery.addressLine1,
      addressLine2: prismaDelivery.addressLine2,
      city: prismaDelivery.city,
      region: prismaDelivery.region,
      postalCode: prismaDelivery.postalCode,
      country: prismaDelivery.country,
      notes: prismaDelivery.notes,
    };
  }
}
