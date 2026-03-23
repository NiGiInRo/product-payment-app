import { Customer as PrismaCustomer } from '../../../../../generated/prisma/client.js';
import { Customer } from '../../../../domain/entities/customer.entity';

export class CustomerPrismaMapper {
  static toDomain(prismaCustomer: PrismaCustomer): Customer {
    return {
      id: prismaCustomer.id,
      fullName: prismaCustomer.fullName,
      email: prismaCustomer.email,
      phone: prismaCustomer.phone,
    };
  }
}
