import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessTransactionPaymentRequest {
  @ApiProperty({
    example: 'tok_stagtest_5113_8Ef2D48e0a4cb50eE912c7E83c9374a4',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiJ9...',
  })
  @IsString()
  @IsNotEmpty()
  acceptanceToken!: string;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiJ9...',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  personalDataAuthToken?: string;

  @ApiProperty({ example: 'nicolas@example.com' })
  @IsEmail()
  customerEmail!: string;
}
