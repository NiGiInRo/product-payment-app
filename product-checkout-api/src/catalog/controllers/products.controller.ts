import {
  Controller,
  Get,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentProductUseCase } from '../application/use-cases/get-current-product.use-case';
import { ProductNotFoundError } from '../domain/errors/product-not-found.error';
import { CurrentProductHttpResponse } from './dto/current-product.http-response';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getCurrentProductUseCase: GetCurrentProductUseCase,
  ) {}

  @Get('current')
  @ApiOperation({ summary: 'Get the current active product for the checkout.' })
  @ApiOkResponse({
    description: 'Returns the current active product and its stock.',
    type: CurrentProductHttpResponse,
  })
  @ApiNotFoundResponse({
    description: 'There is no active product available.',
  })
  async getCurrent(): Promise<CurrentProductHttpResponse> {
    try {
      return await this.getCurrentProductUseCase.execute();
    } catch (error: unknown) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
