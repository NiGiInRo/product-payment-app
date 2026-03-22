import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreatePendingTransactionCustomerRequest {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class CreatePendingTransactionDeliveryRequest {
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePendingTransactionRequest {
  @IsUUID()
  productId!: string;

  @ValidateNested()
  @Type(() => CreatePendingTransactionCustomerRequest)
  customer!: CreatePendingTransactionCustomerRequest;

  @ValidateNested()
  @Type(() => CreatePendingTransactionDeliveryRequest)
  delivery!: CreatePendingTransactionDeliveryRequest;
}
