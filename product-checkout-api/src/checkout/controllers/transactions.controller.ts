import {
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductNotFoundError } from '../../catalog/domain/errors/product-not-found.error';
import { ProductInactiveError } from '../../catalog/domain/errors/product-inactive.error';
import { CreatePendingTransactionUseCase } from '../application/use-cases/create-pending-transaction.use-case';
import { OutOfStockError } from '../domain/errors/out-of-stock.error';
import { CreatePendingTransactionHttpResponse } from './dto/create-pending-transaction.http-response';
import { CreatePendingTransactionRequest } from './dto/create-pending-transaction.request';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createPendingTransactionUseCase: CreatePendingTransactionUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Creates a local pending transaction with frozen pricing.',
    type: CreatePendingTransactionHttpResponse,
  })
  @ApiNotFoundResponse({
    description: 'The product does not exist.',
  })
  @ApiConflictResponse({
    description: 'The product is inactive or out of stock.',
  })
  async createPending(
    @Body() body: CreatePendingTransactionRequest,
  ): Promise<CreatePendingTransactionHttpResponse> {
    try {
      return await this.createPendingTransactionUseCase.execute(body);
    } catch (error: unknown) {
      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ProductInactiveError || error instanceof OutOfStockError) {
        throw new ConflictException(error.message);
      }

      throw error;
    }
  }
}
