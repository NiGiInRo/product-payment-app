import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Nicolas Infante' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'nicolas@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class CreatePendingTransactionDeliveryRequest {
  @ApiProperty({ example: 'Calle 123 # 45 - 67' })
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Apartamento 402' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Bogota' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: 'Cundinamarca' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '110111' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiPropertyOptional({ example: 'Entregar en porteria' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePendingTransactionRequest {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ type: CreatePendingTransactionCustomerRequest })
  @ValidateNested()
  @Type(() => CreatePendingTransactionCustomerRequest)
  customer!: CreatePendingTransactionCustomerRequest;

  @ApiProperty({ type: CreatePendingTransactionDeliveryRequest })
  @ValidateNested()
  @Type(() => CreatePendingTransactionDeliveryRequest)
  delivery!: CreatePendingTransactionDeliveryRequest;
}
