import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../../domain/enums/transaction-status.enum';

class TransactionPricingHttpResponse {
  @ApiProperty()
  amountCents!: number;

  @ApiProperty()
  baseFeeCents!: number;

  @ApiProperty()
  deliveryFeeCents!: number;

  @ApiProperty()
  totalCents!: number;

  @ApiProperty()
  currency!: string;
}

class TransactionProductHttpResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  imageUrl!: string;
}

class TransactionCustomerHttpResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone!: string;
}

class TransactionDeliveryHttpResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  addressLine1!: string;

  @ApiProperty({ required: false })
  addressLine2?: string | null;

  @ApiProperty()
  city!: string;

  @ApiProperty({ required: false })
  region?: string | null;

  @ApiProperty({ required: false })
  postalCode?: string | null;

  @ApiProperty()
  country!: string;

  @ApiProperty({ required: false })
  notes?: string | null;
}

export class GetTransactionStatusHttpResponse {
  @ApiProperty()
  transactionId!: string;

  @ApiProperty({ enum: TransactionStatus })
  status!: TransactionStatus;

  @ApiProperty({ required: false, nullable: true })
  statusReason?: string | null;

  @ApiProperty({ type: TransactionPricingHttpResponse })
  pricing!: TransactionPricingHttpResponse;

  @ApiProperty({ type: TransactionProductHttpResponse })
  product!: TransactionProductHttpResponse;

  @ApiProperty({ type: TransactionCustomerHttpResponse })
  customer!: TransactionCustomerHttpResponse;

  @ApiProperty({ type: TransactionDeliveryHttpResponse })
  delivery!: TransactionDeliveryHttpResponse;
}
