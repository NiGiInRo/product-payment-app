import { ApiProperty } from '@nestjs/swagger';

class PendingTransactionPricingHttpResponse {
  @ApiProperty()
  amountCents!: number;

  @ApiProperty()
  baseFeeCents!: number;

  @ApiProperty()
  deliveryFeeCents!: number;

  @ApiProperty()
  totalCents!: number;
}

export class CreatePendingTransactionHttpResponse {
  @ApiProperty()
  transactionId!: string;

  @ApiProperty({ enum: ['PENDING'] })
  status!: 'PENDING';

  @ApiProperty({ type: PendingTransactionPricingHttpResponse })
  pricing!: PendingTransactionPricingHttpResponse;
}
