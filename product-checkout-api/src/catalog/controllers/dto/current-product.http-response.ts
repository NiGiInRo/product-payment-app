import { ApiProperty } from '@nestjs/swagger';

export class CurrentProductHttpResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  priceCents!: number;

  @ApiProperty()
  stock!: number;

  @ApiProperty()
  imageUrl!: string;

  @ApiProperty({ enum: ['COP'] })
  currency!: 'COP';
}
