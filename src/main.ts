import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  HTTP_CONFIG_TOKEN,
  httpConfig,
  IHttpConfig,
} from '@presentation/http/http.config';
import { Logger, LoggerService } from '@nestjs/common';
import { LoggerModule } from '@infrastructure/logger/logger.module';
import { WinstonLoggerService } from '@infrastructure/logger/winston/winston-logger.service';
import { LOGGER_PROVIDER } from '@infrastructure/logger/provider/logger.provider';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function loadConfig(): Promise<ConfigService> {
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [httpConfig],
    }),
  );

  return appContext.get<ConfigService>(ConfigService);
}

async function loadLogger(): Promise<LoggerService> {
  const appContext = await NestFactory.createApplicationContext(LoggerModule);

  return appContext.get<WinstonLoggerService>(LOGGER_PROVIDER);
}

async function bootstrap() {
  const configService = await loadConfig();
  const logger = await loadLogger();

  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  app.enableCors();

  const bootstrapLogger = new Logger('Bootstrap');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chatterbox API Gateway')
    .setVersion('1')
    .addBearerAuth({ 'x-tokenName': 'Authorization', type: 'http' }, 'Token')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup('swagger', app, swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.init();

  const httpConfig = configService.get<IHttpConfig>(HTTP_CONFIG_TOKEN);

  bootstrapLogger.log(`App is running on port ${httpConfig.port}`);
  await app.listen(httpConfig.port);
}

bootstrap();
