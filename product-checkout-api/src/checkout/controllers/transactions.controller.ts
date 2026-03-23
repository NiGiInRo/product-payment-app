import {
  BadGatewayException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductNotFoundError } from '../../catalog/domain/errors/product-not-found.error';
import { ProductInactiveError } from '../../catalog/domain/errors/product-inactive.error';
import { CreatePendingTransactionUseCase } from '../application/use-cases/create-pending-transaction.use-case';
import { GetTransactionStatusUseCase } from '../application/use-cases/get-transaction-status.use-case';
import { ProcessTransactionPaymentUseCase } from '../application/use-cases/process-transaction-payment.use-case';
import { OutOfStockError } from '../domain/errors/out-of-stock.error';
import { TransactionAlreadyProcessedError } from '../domain/errors/transaction-already-processed.error';
import { TransactionNotFoundError } from '../domain/errors/transaction-not-found.error';
import { CreatePendingTransactionHttpResponse } from './dto/create-pending-transaction.http-response';
import { CreatePendingTransactionRequest } from './dto/create-pending-transaction.request';
import { GetTransactionStatusHttpResponse } from './dto/get-transaction-status.http-response';
import { ProcessTransactionPaymentRequest } from './dto/process-transaction-payment.request';
import { PaymentProcessingError } from '../../payments/domain/errors/payment-processing.error';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly createPendingTransactionUseCase: CreatePendingTransactionUseCase,
    private readonly getTransactionStatusUseCase: GetTransactionStatusUseCase,
    private readonly processTransactionPaymentUseCase: ProcessTransactionPaymentUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a local pending transaction with frozen pricing.' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get the current status and details of a transaction.' })
  @ApiOkResponse({
    description: 'Returns the transaction status and data for refresh recovery.',
    type: GetTransactionStatusHttpResponse,
  })
  @ApiNotFoundResponse({
    description: 'The transaction does not exist.',
  })
  async getById(
    @Param('id') id: string,
  ): Promise<GetTransactionStatusHttpResponse> {
    try {
      return await this.getTransactionStatusUseCase.execute(id);
    } catch (error: unknown) {
      if (error instanceof TransactionNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Post(':id/process-payment')
  @ApiOperation({ summary: 'Process a pending transaction payment through the payment provider.' })
  @ApiOkResponse({
    description: 'Processes a pending transaction with the payment provider and returns the final local status.',
    type: GetTransactionStatusHttpResponse,
  })
  @ApiNotFoundResponse({
    description: 'The transaction does not exist.',
  })
  @ApiConflictResponse({
    description:
      'The transaction is no longer pending, the product is inactive, or the stock is exhausted.',
  })
  @ApiBadGatewayResponse({
    description: 'The payment provider integration failed or rejected the payment request.',
  })
  @HttpCode(200)
  async processPayment(
    @Param('id') id: string,
    @Body() body: ProcessTransactionPaymentRequest,
  ): Promise<GetTransactionStatusHttpResponse> {
    try {
      return await this.processTransactionPaymentUseCase.execute({
        transactionId: id,
        paymentMethodToken: body.paymentMethodToken,
        acceptanceToken: body.acceptanceToken,
        personalDataAuthToken: body.personalDataAuthToken,
        customerEmail: body.customerEmail,
      });
    } catch (error: unknown) {
      if (error instanceof TransactionNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (
        error instanceof TransactionAlreadyProcessedError ||
        error instanceof ProductInactiveError ||
        error instanceof OutOfStockError
      ) {
        throw new ConflictException(error.message);
      }

      if (error instanceof PaymentProcessingError) {
        throw new BadGatewayException(error.message);
      }

      throw error;
    }
  }
}
