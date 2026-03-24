import { Customer } from '../../domain/entities/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CustomerRepository {
  create(customer: Customer): Promise<Customer>;
}
