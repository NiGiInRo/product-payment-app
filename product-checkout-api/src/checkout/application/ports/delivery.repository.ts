import { Delivery } from '../../domain/entities/delivery.entity';

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');

export interface DeliveryRepository {
  create(delivery: Delivery): Promise<Delivery>;
}
