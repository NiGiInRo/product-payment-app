import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/persistence/prisma/prisma.service';
import { CustomerRepository } from '../../../application/ports/customer.repository';
import { Customer } from '../../../domain/entities/customer.entity';
import { CustomerPrismaMapper } from './mappers/customer-prisma.mapper';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(customer: Customer): Promise<Customer> {
    const createdCustomer = await this.prismaService.customer.create({
      data: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });

    return CustomerPrismaMapper.toDomain(createdCustomer);
  }
}
