import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'product-checkout-api',
      status: 'ok',
      docsPath: '/docs',
    };
  }
}
