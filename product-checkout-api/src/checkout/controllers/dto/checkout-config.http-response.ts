import { ApiProperty } from '@nestjs/swagger';

class LegalLinksHttpResponse {
  @ApiProperty()
  acceptance!: string;

  @ApiProperty({ required: false })
  personalDataAuthorization?: string;
}

export class CheckoutConfigHttpResponse {
  @ApiProperty()
  publicKey!: string;

  @ApiProperty()
  acceptanceToken!: string;

  @ApiProperty({ required: false })
  personalDataAuthToken?: string;

  @ApiProperty({ type: LegalLinksHttpResponse })
  legalLinks!: LegalLinksHttpResponse;
}
