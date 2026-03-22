import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessTransactionPaymentRequest {
  @IsString()
  @IsNotEmpty()
  paymentMethodToken!: string;

  @IsString()
  @IsNotEmpty()
  acceptanceToken!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  personalDataAuthToken?: string;

  @IsEmail()
  customerEmail!: string;
}
