import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT') ?? 3000);

  await app.listen(port);
  Logger.log(`HTTP server listening on http://localhost:${port}`);
}
bootstrap();
