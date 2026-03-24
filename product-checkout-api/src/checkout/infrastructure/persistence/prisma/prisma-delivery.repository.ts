import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { DeliveryRepository } from '../../../application/ports/delivery.repository';
import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryPrismaMapper } from './mappers/delivery-prisma.mapper';

@Injectable()
export class PrismaDeliveryRepository implements DeliveryRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(delivery: Delivery): Promise<Delivery> {
    const createdDelivery = await this.prismaService.delivery.create({
      data: {
        id: delivery.id,
        addressLine1: delivery.addressLine1,
        addressLine2: delivery.addressLine2,
        city: delivery.city,
        region: delivery.region,
        postalCode: delivery.postalCode,
        country: delivery.country,
        notes: delivery.notes,
      },
    });

    return DeliveryPrismaMapper.toDomain(createdDelivery);
  }
}
