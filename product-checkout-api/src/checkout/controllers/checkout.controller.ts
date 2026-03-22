import {
  BadGatewayException,
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCheckoutConfigUseCase } from '../application/use-cases/get-checkout-config.use-case';
import { CheckoutConfigHttpResponse } from './dto/checkout-config.http-response';
import { WompiMerchantConfigError } from '../../payments/domain/errors/wompi-merchant-config.error';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly getCheckoutConfigUseCase: GetCheckoutConfigUseCase,
  ) {}

  @Get('config')
  @ApiOkResponse({
    description: 'Returns the checkout configuration required by the frontend.',
    type: CheckoutConfigHttpResponse,
  })
  @ApiBadGatewayResponse({
    description: 'The checkout configuration could not be retrieved from Wompi.',
  })
  async getConfig(): Promise<CheckoutConfigHttpResponse> {
    try {
      return await this.getCheckoutConfigUseCase.execute();
    } catch (error: unknown) {
      if (error instanceof WompiMerchantConfigError) {
        throw new BadGatewayException(error.message);
      }

      throw error;
    }
  }
}
